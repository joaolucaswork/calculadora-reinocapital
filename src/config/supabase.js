/**
 * Supabase Configuration - Versão Webflow TXT
 * Configure your Supabase project credentials here
 * Versão sem imports/exports para uso direto no Webflow
 */

(function() {
  'use strict';

  // Supabase project configuration
  const SUPABASE_URL = 'https://dwpsyresppubuxbrwrkc.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3cHN5cmVzcHB1YnV4YnJ3cmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjcxNzgsImV4cCI6MjA2ODk0MzE3OH0.Z0sA04rkEBVGnQqmHy8UO7FCzYjCCsG7ENCBuY4Ijbc';

  // Aguarda Supabase carregar
  function waitForSupabase() {
    return new Promise((resolve) => {
      const check = () => {
        if (window.supabase && window.supabase.createClient) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  // Inicializa cliente Supabase
  async function initSupabase() {
    try {
      await waitForSupabase();
      
      // Create Supabase client
      const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      // Database table name
      const TABLE_NAME = 'calculator_submissions';

      // Schema for the data structure
      const DATA_SCHEMA = {
        id: 'uuid',
        patrimonio: 'numeric',
        ativos_escolhidos: 'jsonb',
        alocacao: 'jsonb',
        submitted_at: 'timestamp with time zone',
        user_agent: 'text',
        session_id: 'text',
        total_alocado: 'numeric',
        percentual_alocado: 'numeric',
        patrimonio_restante: 'numeric',
      };

      // Helper function to validate environment
      function validateSupabaseConfig() {
        if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
          console.error('❌ Supabase not configured. Please update supabase config with your credentials.');
          return false;
        }
        return true;
      }

      // Função para salvar dados da calculadora
      async function saveCalculatorData(data) {
        try {
          if (!validateSupabaseConfig()) {
            throw new Error('Supabase not configured');
          }

          const { data: result, error } = await supabaseClient
            .from(TABLE_NAME)
            .insert([{
              patrimonio: data.patrimonio,
              ativos_escolhidos: data.ativosEscolhidos,
              alocacao: data.alocacao,
              user_agent: navigator.userAgent,
              session_id: data.sessionId || crypto.randomUUID(),
              total_alocado: data.totalAlocado,
              percentual_alocado: data.percentualAlocado,
              patrimonio_restante: data.patrimonioRestante
            }]);

          if (error) {
            throw error;
          }

          return { success: true, data: result };
        } catch (error) {
          console.error('Erro ao salvar no Supabase:', error);
          return { success: false, error: error.message };
        }
      }

      // Função para buscar dados históricos
      async function getCalculatorHistory(sessionId) {
        try {
          if (!validateSupabaseConfig()) {
            return { success: false, error: 'Supabase not configured' };
          }

          const { data, error } = await supabaseClient
            .from(TABLE_NAME)
            .select('*')
            .eq('session_id', sessionId)
            .order('submitted_at', { ascending: false });

          if (error) {
            throw error;
          }

          return { success: true, data };
        } catch (error) {
          console.error('Erro ao buscar histórico:', error);
          return { success: false, error: error.message };
        }
      }

      // Exporta globalmente
      window.ReinoSupabase = {
        client: supabaseClient,
        tableName: TABLE_NAME,
        schema: DATA_SCHEMA,
        saveCalculatorData,
        getCalculatorHistory,
        validateConfig: validateSupabaseConfig
      };

      document.dispatchEvent(new CustomEvent('supabaseReady', {
        detail: { configured: validateSupabaseConfig() }
      }));

    } catch (error) {
      console.error('Erro ao inicializar Supabase:', error);
      
      // Fallback sem Supabase
      window.ReinoSupabase = {
        client: null,
        saveCalculatorData: async () => ({ success: false, error: 'Supabase not available' }),
        getCalculatorHistory: async () => ({ success: false, error: 'Supabase not available' }),
        validateConfig: () => false
      };
    }
  }

  // Auto-inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
  } else {
    initSupabase();
  }

})();