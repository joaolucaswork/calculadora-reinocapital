/**
 * Salesforce Integration Module
 * Main entry point for Salesforce integration features
 * Versão sem imports/exports para uso direto no Webflow
 */

(function () {
  'use strict';

  // Global instance
  let syncSystem = null;

  // Wait for dependencies to be available
  function waitForDependencies() {
    return new Promise((resolve) => {
      const check = () => {
        if (window.ReinoSalesforceSyncSystem && window.ReinoSupabase && window.ReinoSalesforce) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  /**
   * Initialize Salesforce integration
   */
  async function initSalesforceIntegration() {
    try {
      if (syncSystem) {
        return syncSystem;
      }

      // Wait for dependencies
      await waitForDependencies();

      // Create and initialize sync system
      syncSystem = new window.ReinoSalesforceSyncSystem();
      await syncSystem.init();

      // Add to window for debugging (development only)
      if (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.search.includes('debug=true')
      ) {
        window.salesforceSync = {
          system: syncSystem,
          manualSync: (id) => syncSystem.manualSync(id),
          getStatus: () => syncSystem.getStatus(),
          getSyncStatus: () => syncSystem.getSyncStatus(),
          retryFailed: () => syncSystem.retryFailedSyncs(),
        };

        // eslint-disable-next-line no-console
        console.log('🔧 Salesforce debug tools available at window.salesforceSync');
      }

      return syncSystem;
    } catch (error) {
      console.error('❌ Failed to initialize Salesforce integration:', error);
      return null;
    }
  }

  /**
   * Get current sync system instance
   */
  function getSalesforceSync() {
    return syncSystem;
  }

  /**
   * Manual sync of specific submission
   */
  async function manualSyncSubmission(submissionId) {
    if (!syncSystem) {
      console.error('❌ Salesforce sync system not initialized');
      return false;
    }

    return syncSystem.manualSync(submissionId);
  }

  /**
   * Get sync status for all submissions
   */
  async function getSyncStatusReport() {
    if (!syncSystem) {
      console.error('❌ Salesforce sync system not initialized');
      return null;
    }

    return syncSystem.getSyncStatus();
  }

  /**
   * Retry all failed syncs
   */
  async function retryFailedSyncs() {
    if (!syncSystem) {
      console.error('❌ Salesforce sync system not initialized');
      return 0;
    }

    return syncSystem.retryFailedSyncs();
  }

  /**
   * Check if Salesforce integration is ready
   */
  function isSalesforceReady() {
    return syncSystem && syncSystem.isInitialized;
  }

  /**
   * Create debug dashboard (development only)
   */
  function createDebugDashboard() {
    if (
      !(
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.search.includes('debug=true')
      )
    ) {
      return;
    }

    // Create floating debug panel
    const dashboard = document.createElement('div');
    dashboard.id = 'salesforce-debug-dashboard';
    dashboard.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 300px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 15px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    transition: transform 0.3s ease;
  `;

    dashboard.innerHTML = `
    <div style="margin-bottom: 10px; font-weight: bold; color: #926f1b;">
      🔄 Salesforce Integration Debug
    </div>
    <div id="salesforce-status">Loading...</div>
    <div style="margin-top: 10px;">
      <button onclick="window.salesforceSync.getSyncStatus().then(console.log)" 
              style="margin: 2px; padding: 4px 8px; font-size: 10px;">
        📊 Sync Status
      </button>
      <button onclick="window.salesforceSync.retryFailed().then(console.log)" 
              style="margin: 2px; padding: 4px 8px; font-size: 10px;">
        🔄 Retry Failed
      </button>
    </div>
    <div style="margin-top: 8px; font-size: 10px; opacity: 0.8;">
      Check console for detailed output
    </div>
  `;

    document.body.appendChild(dashboard);

    // Update status periodically
    const updateStatus = async () => {
      const statusElement = document.getElementById('salesforce-status');
      if (!statusElement) return;

      try {
        const status = syncSystem ? syncSystem.getStatus() : { isInitialized: false };
        const syncStatus = syncSystem ? await syncSystem.getSyncStatus() : null;

        statusElement.innerHTML = `
        <div>Initialized: ${status.isInitialized ? '✅' : '❌'}</div>
        <div>Debug Mode: ${status.debugMode ? '✅' : '❌'}</div>
        <div>Queue Length: ${status.queueLength || 0}</div>
        <div>Processing: ${status.isProcessing ? '🔄' : '⏸️'}</div>
        ${
          syncStatus
            ? `
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #333;">
          <div>Total: ${syncStatus.total}</div>
          <div>Synced: ${syncStatus.synced}</div>
          <div>Pending: ${syncStatus.pending}</div>
          <div>Failed: ${syncStatus.failed}</div>
        </div>
        `
            : ''
        }
      `;
      } catch (error) {
        statusElement.innerHTML = `<div style="color: #f44336;">Error: ${error.message}</div>`;
      }
    };

    // Update immediately and then every 5 seconds
    updateStatus();
    setInterval(updateStatus, 5000);

    // Make dashboard collapsible
    dashboard.addEventListener('click', (e) => {
      if (e.target === dashboard) {
        const content = dashboard.querySelector('#salesforce-status').parentElement;
        const isCollapsed = content.style.display === 'none';
        content.style.display = isCollapsed ? 'block' : 'none';
        dashboard.style.transform = isCollapsed ? 'scale(1)' : 'scale(0.8)';
      }
    });

    // eslint-disable-next-line no-console
    console.log('🎛️ Salesforce debug dashboard created');
  }

  // Export globally
  window.ReinoSalesforceIntegration = {
    init: initSalesforceIntegration,
    getSync: getSalesforceSync,
    manualSync: manualSyncSubmission,
    getSyncStatus: getSyncStatusReport,
    retryFailed: retryFailedSyncs,
    isReady: isSalesforceReady,
    createDebugDashboard,
  };

  // For backward compatibility
  window.initSalesforceIntegration = initSalesforceIntegration;
  window.getSalesforceSync = getSalesforceSync;
  window.manualSyncSubmission = manualSyncSubmission;
  window.getSyncStatusReport = getSyncStatusReport;
  window.retryFailedSyncs = retryFailedSyncs;
  window.isSalesforceReady = isSalesforceReady;

  /**
   * Auto-initialize on page load (if config is available)
   */
  document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure other modules are loaded
    setTimeout(async () => {
      await initSalesforceIntegration();

      // Create debug dashboard in development
      if (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.search.includes('debug=true')
      ) {
        createDebugDashboard();
      }
    }, 1000);
  });

  // Dispatch ready event
  document.dispatchEvent(
    new CustomEvent('salesforceIntegrationReady', {
      detail: { available: true },
    })
  );
})();
