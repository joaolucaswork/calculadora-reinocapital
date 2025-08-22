/**
 * Salesforce Sync System
 * Handles synchronization of data from Supabase to Salesforce
 */
import {
  SALESFORCE_CONFIG,
  salesforceAPI,
  validateSalesforceConfig,
} from '../config/salesforce.js';
import { supabase, TABLE_NAME } from '../config/supabase.js';

export class SalesforceSyncSystem {
  constructor() {
    this.isInitialized = false;
    this.debugMode = false;
    this.syncQueue = [];
    this.isProcessing = false;
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  async init() {
    if (this.isInitialized) return;

    try {
      // Enable debug mode if in development
      this.debugMode =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.search.includes('debug=true');

      // Validate Salesforce configuration
      const configValidation = validateSalesforceConfig();
      if (!configValidation.isValid) {
        console.warn('⚠️ Salesforce integration disabled:', configValidation.message);
        return;
      }

      // Initialize Salesforce API
      const initialized = await salesforceAPI.init();
      if (!initialized) {
        console.error('❌ Failed to initialize Salesforce API');
        return;
      }

      // Setup Supabase listener for new submissions
      this.setupSupabaseListener();

      // Process any existing queue
      this.processQueue();

      this.isInitialized = true;

      if (this.debugMode) {
        // eslint-disable-next-line no-console
        console.log('✅ Salesforce Sync System initialized');
      }
    } catch (error) {
      console.error('❌ Salesforce Sync System init failed:', error);
    }
  }

  /**
   * Setup real-time listener for new Supabase submissions
   */
  setupSupabaseListener() {
    // Listen for INSERT events on calculator_submissions table
    const subscription = supabase
      .channel('calculator_submissions_sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: TABLE_NAME,
        },
        (payload) => {
          if (this.debugMode) {
            // eslint-disable-next-line no-console
            console.log('📩 New submission detected:', payload.new);
          }
          this.queueForSync(payload.new);
        }
      )
      .subscribe();

    if (this.debugMode) {
      // eslint-disable-next-line no-console
      console.log('🔄 Supabase real-time listener setup for table:', TABLE_NAME);
    }

    // Store subscription for cleanup
    this.subscription = subscription;
  }

  /**
   * Add submission to sync queue
   * @param {Object} submission - Submission data from Supabase
   */
  queueForSync(submission) {
    const syncItem = {
      id: submission.id,
      data: submission,
      attempts: 0,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    this.syncQueue.push(syncItem);

    if (this.debugMode) {
      // eslint-disable-next-line no-console
      console.log('📝 Queued for Salesforce sync:', syncItem.id);
    }

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process the sync queue
   */
  async processQueue() {
    if (this.isProcessing || this.syncQueue.length === 0) return;

    this.isProcessing = true;

    try {
      while (this.syncQueue.length > 0) {
        const item = this.syncQueue[0]; // Get first item
        const success = await this.syncToSalesforce(item);

        if (success) {
          // Remove successful item from queue
          this.syncQueue.shift();
          if (this.debugMode) {
            // eslint-disable-next-line no-console
            console.log('✅ Successfully synced to Salesforce:', item.id);
          }
        } else {
          // Handle retry logic
          item.attempts += 1;
          if (item.attempts >= this.retryAttempts) {
            // Max retries reached, remove from queue and log error
            this.syncQueue.shift();
            console.error('❌ Max retries reached for sync:', item.id);

            // Optionally save failed sync for manual review
            this.logFailedSync(item);
          } else {
            // Wait before retry
            if (this.debugMode) {
              // eslint-disable-next-line no-console
              console.log(
                `🔄 Retrying sync for ${item.id} (attempt ${item.attempts}/${this.retryAttempts})`
              );
            }
            await this.delay(this.retryDelay);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error processing sync queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Sync single submission to Salesforce
   * @param {Object} syncItem - Sync item with submission data
   * @returns {Promise<boolean>} Success status
   */
  async syncToSalesforce(syncItem) {
    try {
      const { data: submission } = syncItem;

      // Transform Supabase data to Salesforce format
      const salesforceData = this.transformDataForSalesforce(submission);

      // Create record in Salesforce
      const result = await salesforceAPI.createRecord(
        SALESFORCE_CONFIG.OBJECTS.CALCULATOR_SUBMISSION,
        salesforceData
      );

      if (result.success !== false) {
        // Update Supabase record with Salesforce ID
        await this.updateSupabaseWithSalesforceId(submission.id, result.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error syncing to Salesforce:', error);
      return false;
    }
  }

  /**
   * Transform Supabase data to Salesforce field format
   * @param {Object} submission - Supabase submission data
   * @returns {Object} Salesforce formatted data
   */
  transformDataForSalesforce(submission) {
    // Map Supabase fields to Salesforce custom object fields
    const salesforceData = {
      Name: `Calculadora - ${submission.id}`, // Record name
      Supabase_ID__c: submission.id,
      Patrimonio__c: submission.patrimonio,
      Ativos_Escolhidos__c: JSON.stringify(submission.ativos_escolhidos),
      Alocacao__c: JSON.stringify(submission.alocacao),
      Total_Alocado__c: submission.total_alocado,
      Percentual_Alocado__c: submission.percentual_alocado,
      Patrimonio_Restante__c: submission.patrimonio_restante,
      Data_Submissao__c: submission.submitted_at,
      User_Agent__c: submission.user_agent,
      Session_ID__c: submission.session_id,
      Created_Date__c: submission.created_at,
    };

    // Add computed fields
    salesforceData.Status__c = 'Novo';
    salesforceData.Source__c = 'Website Calculator';

    // Extract summary information for easy viewing in Salesforce
    if (submission.ativos_escolhidos && Array.isArray(submission.ativos_escolhidos)) {
      const categories = submission.ativos_escolhidos.map((item) => item.category).filter(Boolean);
      const uniqueCategories = [...new Set(categories)];
      salesforceData.Categorias_Selecionadas__c = uniqueCategories.join(', ');
      salesforceData.Total_Ativos_Selecionados__c = submission.ativos_escolhidos.length;
    }

    // Calculate allocation summary
    if (submission.alocacao && typeof submission.alocacao === 'object') {
      const allocations = Object.values(submission.alocacao);
      const totalItems = allocations.length;
      const itemsWithValue = allocations.filter((item) => item.value > 0).length;

      salesforceData.Total_Itens_Alocacao__c = totalItems;
      salesforceData.Itens_Com_Valor__c = itemsWithValue;
      salesforceData.Taxa_Preenchimento__c =
        totalItems > 0 ? (itemsWithValue / totalItems) * 100 : 0;
    }

    return salesforceData;
  }

  /**
   * Update Supabase record with Salesforce ID
   * @param {string} supabaseId - Supabase record ID
   * @param {string} salesforceId - Salesforce record ID
   */
  async updateSupabaseWithSalesforceId(supabaseId, salesforceId) {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({
          salesforce_id: salesforceId,
          synced_at: new Date().toISOString(),
          sync_status: 'synced',
        })
        .eq('id', supabaseId);

      if (error) {
        console.error('❌ Error updating Supabase with Salesforce ID:', error);
      } else if (this.debugMode) {
        // eslint-disable-next-line no-console
        console.log('✅ Updated Supabase record with Salesforce ID:', salesforceId);
      }
    } catch (error) {
      console.error('❌ Error updating Supabase record:', error);
    }
  }

  /**
   * Log failed sync for manual review
   * @param {Object} syncItem - Failed sync item
   */
  async logFailedSync(syncItem) {
    try {
      // Update Supabase record to mark as failed
      await supabase
        .from(TABLE_NAME)
        .update({
          sync_status: 'failed',
          sync_error: `Failed after ${syncItem.attempts} attempts`,
          last_sync_attempt: new Date().toISOString(),
        })
        .eq('id', syncItem.data.id);

      console.error('❌ Logged failed sync for manual review:', syncItem.id);
    } catch (error) {
      console.error('❌ Error logging failed sync:', error);
    }
  }

  /**
   * Manual sync of specific submission
   * @param {string} submissionId - Supabase submission ID
   * @returns {Promise<boolean>} Success status
   */
  async manualSync(submissionId) {
    try {
      // Get submission from Supabase
      const { data: submission, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error || !submission) {
        console.error('❌ Submission not found:', submissionId);
        return false;
      }

      // Create sync item and process
      const syncItem = {
        id: submission.id,
        data: submission,
        attempts: 0,
        timestamp: new Date().toISOString(),
        status: 'manual',
      };

      const success = await this.syncToSalesforce(syncItem);

      if (success) {
        // eslint-disable-next-line no-console
        console.log('✅ Manual sync successful:', submissionId);
      } else {
        console.error('❌ Manual sync failed:', submissionId);
      }

      return success;
    } catch (error) {
      console.error('❌ Error in manual sync:', error);
      return false;
    }
  }

  /**
   * Get sync status for all submissions
   * @returns {Promise<Object>} Sync status summary
   */
  async getSyncStatus() {
    try {
      const { data: submissions, error } = await supabase
        .from(TABLE_NAME)
        .select('id, sync_status, salesforce_id, synced_at, sync_error')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Error getting sync status:', error);
        return null;
      }

      const summary = {
        total: submissions.length,
        synced: submissions.filter((s) => s.sync_status === 'synced').length,
        pending: submissions.filter((s) => !s.sync_status || s.sync_status === 'pending').length,
        failed: submissions.filter((s) => s.sync_status === 'failed').length,
        queueLength: this.syncQueue.length,
        isProcessing: this.isProcessing,
        submissions,
      };

      return summary;
    } catch (error) {
      console.error('❌ Error getting sync status:', error);
      return null;
    }
  }

  /**
   * Retry all failed syncs
   * @returns {Promise<number>} Number of retries queued
   */
  async retryFailedSyncs() {
    try {
      const { data: failedSubmissions, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('sync_status', 'failed');

      if (error) {
        console.error('❌ Error getting failed submissions:', error);
        return 0;
      }

      let retryCount = 0;
      for (const submission of failedSubmissions) {
        // Reset sync status
        await supabase.from(TABLE_NAME).update({ sync_status: 'pending' }).eq('id', submission.id);

        // Add to queue
        this.queueForSync(submission);
        retryCount += 1;
      }

      // eslint-disable-next-line no-console
      console.log(`🔄 Queued ${retryCount} failed submissions for retry`);
      return retryCount;
    } catch (error) {
      console.error('❌ Error retrying failed syncs:', error);
      return 0;
    }
  }

  /**
   * Utility function for delays
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.syncQueue = [];
    this.isProcessing = false;
    this.isInitialized = false;
  }

  /**
   * Get system status for debugging
   * @returns {Object} System status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      debugMode: this.debugMode,
      queueLength: this.syncQueue.length,
      isProcessing: this.isProcessing,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay,
    };
  }
}
