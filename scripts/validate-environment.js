#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates that all required environment configurations are properly set up
 * for database isolation testing in the Reino Capital Calculator project.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

class EnvironmentValidator {
  constructor(environment = 'testing') {
    this.environment = environment;
    this.errors = [];
    this.warnings = [];
    this.success = [];
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    const prefix = {
      error: '❌',
      warning: '⚠️',
      success: '✅',
      info: 'ℹ️',
    }[type];

    console.log(`${prefix} ${message}`);

    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
    if (type === 'success') this.success.push(message);
  }

  validateFileExists(filePath, description) {
    if (existsSync(filePath)) {
      this.log('success', `${description} exists: ${filePath}`);
      return true;
    }
    this.log('error', `${description} missing: ${filePath}`);
    return false;
  }

  validateEnvironmentFiles() {
    this.log('info', 'Validating environment files...');

    const requiredFiles = [
      { path: '.env.testing', desc: 'Testing environment file' },
      { path: '.env.production', desc: 'Production environment file' },
      { path: '.env.example', desc: 'Example environment file' },
    ];

    let allFilesExist = true;
    requiredFiles.forEach((file) => {
      if (!this.validateFileExists(file.path, file.desc)) {
        allFilesExist = false;
      }
    });

    return allFilesExist;
  }

  validateEnvironmentVariables() {
    this.log('info', `Validating environment variables for ${this.environment}...`);

    // Load environment-specific config
    const envFile = `.env.${this.environment}`;
    if (existsSync(envFile)) {
      dotenv.config({ path: envFile });
    } else {
      this.log('error', `Environment file not found: ${envFile}`);
      return false;
    }

    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'ENVIRONMENT',
    ];

    const testingVars = ['NODE_ENV', 'DEBUG', 'TEST_MODE'];

    let allVarsValid = true;

    // Check required variables
    requiredVars.forEach((varName) => {
      const value = process.env[varName];
      if (!value) {
        this.log('error', `Missing required environment variable: ${varName}`);
        allVarsValid = false;
      } else if (value.includes('your-') || value.includes('example')) {
        this.log('error', `Environment variable contains placeholder value: ${varName}`);
        allVarsValid = false;
      } else {
        this.log('success', `Environment variable set: ${varName}`);
      }
    });

    // Check testing-specific variables
    if (this.environment === 'testing') {
      testingVars.forEach((varName) => {
        const value = process.env[varName];
        if (!value) {
          this.log('warning', `Testing environment variable not set: ${varName}`);
        } else {
          this.log('success', `Testing variable set: ${varName}=${value}`);
        }
      });
    }

    // Validate environment consistency
    const envValue = process.env.ENVIRONMENT;
    if (envValue !== this.environment) {
      this.log('warning', `Environment mismatch: expected ${this.environment}, got ${envValue}`);
    }

    return allVarsValid;
  }

  async validateSupabaseConnection() {
    this.log('info', 'Validating Supabase connection...');

    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey || !serviceKey) {
      this.log('error', 'Missing Supabase credentials');
      return false;
    }

    try {
      // Test anonymous client connection
      const anonClient = createClient(url, anonKey);
      const { data: anonData, error: anonError } = await anonClient
        .from('calculator_submissions')
        .select('count', { count: 'exact', head: true });

      if (anonError) {
        this.log('error', `Anonymous client connection failed: ${anonError.message}`);
        return false;
      }
      this.log('success', 'Anonymous client connection successful');

      // Test service role client connection
      const serviceClient = createClient(url, serviceKey);
      const { data: serviceData, error: serviceError } = await serviceClient
        .from('calculator_submissions')
        .select('count', { count: 'exact', head: true });

      if (serviceError) {
        this.log('error', `Service role client connection failed: ${serviceError.message}`);
        return false;
      }
      this.log('success', 'Service role client connection successful');

      return true;
    } catch (error) {
      this.log('error', `Supabase connection test failed: ${error.message}`);
      return false;
    }
  }

  async validateDatabaseSchema() {
    this.log('info', 'Validating database schema...');

    const serviceClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
      // Check if required columns exist by attempting to select them
      const { data, error } = await serviceClient
        .from('calculator_submissions')
        .select('id, environment, created_by, test_run_id')
        .limit(1);

      if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          this.log('error', `Database schema missing required columns: ${error.message}`);
          this.log('info', 'Required columns: environment, created_by, test_run_id');
          return false;
        }
        this.log('warning', `Schema validation warning: ${error.message}`);
      } else {
        this.log('success', 'Database schema validation passed');
      }

      return true;
    } catch (error) {
      this.log('error', `Database schema validation failed: ${error.message}`);
      return false;
    }
  }

  async validatePlaywrightConfiguration() {
    this.log('info', 'Validating Playwright configuration...');

    const configFile = 'playwright.config.ts';
    if (!this.validateFileExists(configFile, 'Playwright configuration')) {
      return false;
    }

    // Check if Chromium is installed
    try {
      const { execSync } = await import('child_process');
      execSync('npx playwright list', { stdio: 'pipe' });
      this.log('success', 'Playwright browsers are installed');
      return true;
    } catch (error) {
      this.log(
        'warning',
        'Playwright browsers may not be installed. Run: npx playwright install chromium'
      );
      return true; // Don't fail validation for missing browsers - just warn
    }
  }

  validatePackageConfiguration() {
    this.log('info', 'Validating package configuration...');

    const packageFile = 'package.json';
    if (!this.validateFileExists(packageFile, 'Package configuration')) {
      return false;
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageFile, 'utf8'));

      // Check for required scripts
      const requiredScripts = ['test:isolation', 'db:cleanup:testing', 'db:status'];

      let allScriptsExist = true;
      requiredScripts.forEach((script) => {
        if (packageJson.scripts && packageJson.scripts[script]) {
          this.log('success', `Package script exists: ${script}`);
        } else {
          this.log('error', `Missing package script: ${script}`);
          allScriptsExist = false;
        }
      });

      // Check for required dependencies
      const requiredDeps = ['@playwright/test', '@supabase/supabase-js', 'dotenv'];

      requiredDeps.forEach((dep) => {
        const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        if (allDeps[dep]) {
          this.log('success', `Dependency installed: ${dep}@${allDeps[dep]}`);
        } else {
          this.log('error', `Missing dependency: ${dep}`);
          allScriptsExist = false;
        }
      });

      return allScriptsExist;
    } catch (error) {
      this.log('error', `Package configuration validation failed: ${error.message}`);
      return false;
    }
  }

  async runValidation() {
    console.log(`🔍 Starting environment validation for ${this.environment} environment\n`);

    const validations = [
      () => this.validateEnvironmentFiles(),
      () => this.validateEnvironmentVariables(),
      () => this.validateSupabaseConnection(),
      () => this.validateDatabaseSchema(),
      () => this.validatePlaywrightConfiguration(),
      () => this.validatePackageConfiguration(),
    ];

    let allValid = true;
    for (const validation of validations) {
      try {
        const result = await validation();
        if (!result) allValid = false;
      } catch (error) {
        this.log('error', `Validation failed: ${error.message}`);
        allValid = false;
      }
      console.log(''); // Add spacing between validations
    }

    // Summary
    console.log('📊 Validation Summary:');
    console.log(`  ✅ Successful checks: ${this.success.length}`);
    console.log(`  ⚠️  Warnings: ${this.warnings.length}`);
    console.log(`  ❌ Errors: ${this.errors.length}\n`);

    if (this.errors.length > 0) {
      console.log('❌ Critical Issues Found:');
      this.errors.forEach((error) => console.log(`  - ${error}`));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      this.warnings.forEach((warning) => console.log(`  - ${warning}`));
      console.log('');
    }

    if (allValid && this.errors.length === 0) {
      if (this.warnings.length > 0) {
        console.log('⚠️  Environment validation passed with warnings. Review warnings above.');
      } else {
        console.log('🎉 Environment validation passed! Ready for database isolation testing.');
      }
      return true;
    }
    console.log(
      '💥 Environment validation failed. Please fix the critical issues above before proceeding.'
    );
    return false;
  }
}

// CLI interface
function showHelp() {
  console.log(`
🔍 Environment Validation Script

Usage: node scripts/validate-environment.js [environment] [options]

Environments:
  testing     Validate testing environment (default)
  production  Validate production environment
  development Validate development environment

Options:
  --help      Show this help message

Examples:
  node scripts/validate-environment.js testing
  node scripts/validate-environment.js production
  npm run validate:env
`);
}

// Execute if this is the main module
if (process.argv[1] && process.argv[1].endsWith('validate-environment.js')) {
  if (process.argv.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  const environment = process.argv[2] || 'testing';
  const validator = new EnvironmentValidator(environment);

  validator
    .runValidation()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Validation script failed:', error.message);
      process.exit(1);
    });
}

export default EnvironmentValidator;
