/**
 * Reino Event Contracts - Standardized Event System
 * Versão sem imports/exports para uso direto no Webflow
 *
 * Define contratos padronizados para todos os eventos do sistema
 * Garante consistência de payloads e facilita debugging
 */

(function () {
  'use strict';

  class ReinoEventContracts {
    constructor() {
      this.isInitialized = false;
      this.debugMode = false;
      this.verboseMode = false; // Controle separado para logs verbosos
      this.eventHistory = [];
      this.maxHistorySize = 100;
      this.logThrottle = new Map(); // Throttle para eventos repetitivos

      // Contratos de eventos padronizados
      this.contracts = {
        // ==================== PATRIMÔNIO ====================
        patrimonyMainValueChanged: {
          description: 'Disparado quando o valor principal do patrimônio muda',
          payload: {
            value: 'number - Valor numérico do patrimônio',
            formatted: 'string - Valor formatado em moeda (R$ X.XXX,XX)',
            oldValue: 'number - Valor anterior (opcional)',
            source: 'string - Origem da mudança (user, system, debug, etc.)',
          },
          example: {
            value: 1000000,
            formatted: 'R$ 1.000.000,00',
            oldValue: 500000,
            source: 'user',
          },
        },

        totalPatrimonyChanged: {
          description: 'Alias para patrimonyMainValueChanged (compatibilidade)',
          payload: {
            value: 'number - Valor numérico do patrimônio',
            formatted: 'string - Valor formatado em moeda',
          },
        },

        // ==================== SELEÇÃO DE ATIVOS ====================
        assetSelectionChanged: {
          description: 'Disparado quando ativos são selecionados/deselecionados',
          payload: {
            selectedAssets: 'Array<string> - Lista de chaves dos ativos selecionados',
            selectedCount: 'number - Quantidade de ativos selecionados',
            action: 'string - Ação realizada (added, removed, cleared)',
            asset: 'object - Detalhes do ativo alterado (opcional)',
            source: 'string - Origem da mudança',
          },
          example: {
            selectedAssets: ['renda fixa|cdb', 'renda variável|ações'],
            selectedCount: 2,
            action: 'added',
            asset: { category: 'Renda Fixa', product: 'CDB', key: 'renda fixa|cdb' },
            source: 'user',
          },
        },

        assetSelectionSystemReady: {
          description: 'Disparado quando o sistema de seleção de ativos está pronto',
          payload: {
            selectedCount: 'number - Quantidade inicial de ativos selecionados',
            selectedAssets: 'Array<string> - Lista inicial de ativos',
            cacheLoaded: 'boolean - Se dados foram carregados do cache',
          },
        },

        // ==================== ALOCAÇÕES ====================
        allocationChanged: {
          description: 'Disparado quando alocações de patrimônio mudam',
          payload: {
            allocations: 'Record<string, number> - Mapa de alocações por ativo',
            totalAllocated: 'number - Total alocado em valor absoluto',
            remainingPatrimony: 'number - Patrimônio restante',
            percentualAlocado: 'number - Percentual total alocado (0-100)',
            changedAsset: 'object - Detalhes do ativo que mudou (opcional)',
            source: 'string - Origem da mudança',
          },
          example: {
            allocations: { 'renda fixa|cdb': 500000, 'renda variável|ações': 300000 },
            totalAllocated: 800000,
            remainingPatrimony: 200000,
            percentualAlocado: 80,
            changedAsset: {
              category: 'Renda Fixa',
              product: 'CDB',
              key: 'renda fixa|cdb',
              value: 500000,
            },
            source: 'user',
          },
        },

        // ==================== ÍNDICE DE GIRO ====================
        rotationIndexChanged: {
          description: 'Disparado quando o índice de giro muda',
          payload: {
            index: 'number - Novo valor do índice (1-4)',
            oldIndex: 'number - Valor anterior do índice (opcional)',
            calculations: 'Record<string, object> - Cálculos por produto (opcional)',
            source: 'string - Origem da mudança',
          },
          example: {
            index: 3,
            oldIndex: 2,
            calculations: {
              'Renda Fixa:CDB': {
                comissaoRate: 0.015,
                comissaoPercent: 1.5,
                fatorEfetivo: 3.0,
              },
            },
            source: 'user',
          },
        },

        // ==================== RESULTADOS E COMISSÕES ====================
        totalComissaoChanged: {
          description: 'Disparado quando o total de comissão é recalculado',
          payload: {
            total: 'number - Valor total da comissão',
            formatted: 'string - Valor formatado em moeda',
            details: 'Array<object> - Detalhes por produto (opcional)',
            oldTotal: 'number - Valor anterior (opcional)',
            source: 'string - Origem da mudança',
          },
          example: {
            total: 15000,
            formatted: 'R$ 15.000,00',
            details: [
              {
                category: 'Renda Fixa',
                product: 'CDB',
                value: 500000,
                custoAnual: 7500,
                taxaInfo: { min: 1.2, max: 1.8, media: 1.5 },
              },
            ],
            oldTotal: 12000,
            source: 'calculation',
          },
        },

        resultadoComparativoUpdated: {
          description: 'Disparado quando o resultado comparativo é atualizado',
          payload: {
            reino: 'object - Dados do Reino Capital',
            tradicional: 'object - Dados do modelo tradicional',
            source: 'string - Origem da mudança',
          },
          example: {
            reino: {
              annual: 5000,
              patrimony: 1000000,
              formatted: { annual: 'R$ 5.000,00', patrimony: 'R$ 1.000.000,00' },
            },
            tradicional: {
              total: 15000,
              details: [],
            },
            source: 'calculation',
          },
        },

        // ==================== SISTEMA ====================
        appStateReady: {
          description: 'Disparado quando o AppState está inicializado',
          payload: {
            version: 'string - Versão do AppState',
            timestamp: 'string - Timestamp da inicialização',
          },
        },

        stepChanged: {
          description: 'Disparado quando o usuário navega entre seções',
          payload: {
            previousStep: 'number - Seção anterior (opcional)',
            currentStep: 'number - Seção atual',
            canProceed: 'boolean - Se pode prosseguir para próxima seção',
            stepName: 'string - Nome da seção',
            progressBarState: 'object - Estado da barra de progresso',
          },
        },

        // ==================== INTEGRAÇÕES ====================
        typebotCompleted: {
          description: 'Disparado quando o Typebot é completado',
          payload: {
            formData: 'object - Dados do formulário',
            typebotData: 'object - Dados do Typebot',
            userInfo: 'object - Informações do usuário',
            timestamp: 'string - Timestamp da conclusão',
          },
        },

        calendlyEventScheduled: {
          description: 'Disparado quando um evento é agendado no Calendly',
          payload: {
            event: 'object - Dados do evento agendado',
          },
        },
      };
    }

    init() {
      if (this.isInitialized) {
        return;
      }

      console.log('🚀 ReinoEventContracts: Starting initialization...');

      try {
        this.setupEventValidation();
        this.setupEventLogging();
        this.isInitialized = true;

        console.log('✅ Event Contracts system initialized');

        // Disponibiliza contratos globalmente para debug
        if (typeof window !== 'undefined') {
          window.ReinoEventContractsAPI = this.contracts;
        }
      } catch (error) {
        console.error('❌ Failed to initialize Event Contracts:', error);
      }
    }

    setupEventValidation() {
      // Intercepta eventos para validação (apenas em debug mode)
      if (this.debugMode) {
        const originalDispatchEvent = document.dispatchEvent;
        document.dispatchEvent = (event) => {
          this.validateEvent(event);
          return originalDispatchEvent.call(document, event);
        };
      }
    }

    setupEventLogging() {
      // Log de eventos para debug
      Object.keys(this.contracts).forEach((eventName) => {
        document.addEventListener(eventName, (e) => {
          this.logEvent(eventName, e.detail);
        });
      });
    }

    validateEvent(event) {
      const eventName = event.type;
      const contract = this.contracts[eventName];

      if (!contract) {
        this.log(`⚠️ Unknown event: ${eventName}`);
        return;
      }

      // Validação básica do payload
      if (event.detail) {
        this.log(`✅ Event validated: ${eventName}`, event.detail);
      } else {
        this.log(`⚠️ Event without detail: ${eventName}`);
      }
    }

    logEvent(eventName, detail) {
      if (!this.debugMode) {
        return;
      }

      const logEntry = {
        event: eventName,
        detail,
        timestamp: new Date().toISOString(),
      };

      this.eventHistory.push(logEntry);

      // Limita o histórico
      if (this.eventHistory.length > this.maxHistorySize) {
        this.eventHistory.shift();
      }

      // Log inteligente com throttle para eventos repetitivos
      this.smartLog(eventName, detail);
    }

    smartLog(eventName, detail) {
      const now = Date.now();
      const throttleKey = eventName;
      const lastLog = this.logThrottle.get(throttleKey);

      // Eventos que devem sempre ser logados (importantes)
      const alwaysLogEvents = [
        'appStateReady',
        'stepChanged',
        'assetSelectionSystemReady',
        'patrimonySyncReady',
      ];

      // Eventos que devem ser throttled (repetitivos)
      const throttledEvents = [
        'allocationChanged',
        'totalComissaoChanged',
        'resultadoComparativoUpdated',
        'patrimonyMainValueChanged',
      ];

      if (alwaysLogEvents.includes(eventName)) {
        // Sempre loga eventos importantes
        this.log(`📤 Event: ${eventName}`, this.verboseMode ? detail : '(details hidden)');
      } else if (throttledEvents.includes(eventName)) {
        // Throttle eventos repetitivos (máximo 1 por segundo)
        if (!lastLog || now - lastLog > 1000) {
          this.logThrottle.set(throttleKey, now);
          this.log(
            `📤 Event: ${eventName} (throttled)`,
            this.verboseMode ? detail : '(details hidden)'
          );
        }
      } else if (this.verboseMode) {
        // Outros eventos só em modo verbose
        this.log(`📤 Event: ${eventName}`, detail);
      }
    }

    // ==================== API PÚBLICA ====================

    getContract(eventName) {
      return this.contracts[eventName] || null;
    }

    getAllContracts() {
      return this.contracts;
    }

    getEventHistory() {
      return this.eventHistory.slice(-20); // Últimos 20 eventos
    }

    // Helper para criar eventos padronizados
    createEvent(eventName, detail) {
      const contract = this.contracts[eventName];
      if (!contract) {
        console.warn(`⚠️ Creating event without contract: ${eventName}`);
      }

      return new CustomEvent(eventName, { detail });
    }

    // Helper para dispatch padronizado
    dispatchEvent(eventName, detail) {
      const event = this.createEvent(eventName, detail);
      document.dispatchEvent(event);
      return event;
    }

    // ==================== DEBUG ====================

    enableDebug() {
      this.debugMode = true;
      this.verboseMode = false; // Debug básico sem spam
      this.log('🐛 Event Contracts debug mode enabled (basic)');
    }

    enableVerboseDebug() {
      this.debugMode = true;
      this.verboseMode = true;
      this.log('🐛 Event Contracts verbose debug mode enabled (full details)');
    }

    disableDebug() {
      this.debugMode = false;
      this.verboseMode = false;
      this.logThrottle.clear();
    }

    setLogLevel(level) {
      switch (level) {
        case 'off':
          this.disableDebug();
          break;
        case 'basic':
          this.enableDebug();
          break;
        case 'verbose':
          this.enableVerboseDebug();
          break;
        default:
          this.log('⚠️ Invalid log level. Use: off, basic, verbose');
      }
    }

    log(message, data = null) {
      if (this.debugMode) {
        if (data) {
          console.log(`[EventContracts] ${message}`, data);
        } else {
          console.log(`[EventContracts] ${message}`);
        }
      }
    }

    getDebugInfo() {
      return {
        contracts: Object.keys(this.contracts),
        eventHistory: this.getEventHistory(),
        isInitialized: this.isInitialized,
        debugMode: this.debugMode,
      };
    }
  }

  // Criar instância global
  window.ReinoEventContracts = new ReinoEventContracts();

  // Auto-inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReinoEventContracts.init();
    });
  } else {
    window.ReinoEventContracts.init();
  }
})();
