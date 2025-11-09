// ============================================================================
// ImportWizard Component Tests
// Tests state management, step navigation, and API integration
// ============================================================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportWizard } from '../ImportWizard';
import { createSuccessValidationResult, createErrorValidationResult } from '@test-utils/component-mocks/validation-mocks';
import { createMixedDiffResult } from '@test-utils/component-mocks/diff-mocks';
import { TestWrapper } from '@test-utils/test-wrapper';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock LocaleContext
jest.mock('@/contexts/LocaleContext', () => ({
  useLocale: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: jest.fn(),
  }),
}));

// Mock useToast hook
const mockToast = jest.fn();
jest.mock('@/hooks/common/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock child components
jest.mock('../ImportStepIndicator', () => ({
  ImportStepIndicator: ({ currentStep, onStepClick }: any) => (
    <div data-testid="step-indicator" data-current-step={currentStep}>
      <button onClick={() => onStepClick(1)}>Step 1</button>
      <button onClick={() => onStepClick(2)}>Step 2</button>
      <button onClick={() => onStepClick(3)}>Step 3</button>
    </div>
  ),
}));

jest.mock('../steps/ImportStep1Upload', () => ({
  ImportStep1Upload: ({ onFileSelected, isProcessing }: any) => (
    <div data-testid="step-1-upload">
      <button
        onClick={() => {
          const mockFile = new File(['test'], 'test.xlsx', {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          onFileSelected(mockFile);
        }}
        disabled={isProcessing}
      >
        Upload File
      </button>
      {isProcessing && <div>Processing...</div>}
    </div>
  ),
}));

jest.mock('../steps/ImportStep2Validation', () => ({
  ImportStep2Validation: ({ validationResult, onAcknowledgeWarnings, warningsAcknowledged }: any) => (
    <div data-testid="step-2-validation">
      <div>{validationResult.errors.length} errors</div>
      <div>{validationResult.warnings.length} warnings</div>
      <input
        type="checkbox"
        checked={warningsAcknowledged}
        onChange={(e) => onAcknowledgeWarnings(e.target.checked)}
        data-testid="acknowledge-warnings"
      />
    </div>
  ),
}));

jest.mock('../steps/ImportStep2DiffPreview', () => ({
  ImportStep2DiffPreview: ({ diffResult, validationWarnings, onAcknowledgeWarnings, warningsAcknowledged }: any) => (
    <div data-testid="step-3-preview">
      {diffResult && <div>{diffResult.summary.totalChanges} changes</div>}
      {validationWarnings && <div>{validationWarnings.length} warnings</div>}
      <input
        type="checkbox"
        checked={warningsAcknowledged}
        onChange={(e) => onAcknowledgeWarnings?.(e.target.checked)}
        data-testid="acknowledge-preview-warnings"
      />
    </div>
  ),
}));

jest.mock('../steps/ImportStep3Confirmation', () => ({
  ImportStep3Confirmation: ({ importResult, onStartNewImport, onRollback, isRollingBack }: any) => (
    <div data-testid="step-4-confirmation">
      {importResult && <div>Import completed: {importResult.importId}</div>}
      <button onClick={onStartNewImport}>Start New Import</button>
      <button onClick={() => onRollback('test-import-id')} disabled={isRollingBack}>
        Rollback
      </button>
    </div>
  ),
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Upload: () => <div data-testid="upload-icon" />,
}));

describe('ImportWizard', () => {
  // Helper to render with required providers
  const renderImportWizard = () => {
    return render(
      <TestWrapper>
        <ImportWizard />
      </TestWrapper>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('Initial State', () => {
    it('should start on step 1', () => {
      renderImportWizard();

      const stepIndicator = screen.getByTestId('step-indicator');
      expect(stepIndicator).toHaveAttribute('data-current-step', '1');
    });

    it('should display step 1 upload component', () => {
      renderImportWizard();

      expect(screen.getByTestId('step-1-upload')).toBeInTheDocument();
    });

    it('should show cancel button on step 1', () => {
      renderImportWizard();

      expect(screen.getByText('admin.import.buttons.cancel')).toBeInTheDocument();
    });

    it('should have next button disabled initially', () => {
      renderImportWizard();

      const nextButton = screen.getByText('admin.import.buttons.next');
      expect(nextButton).toBeDisabled();
    });

    it('should display page title and description', () => {
      renderImportWizard();

      expect(screen.getByText('admin.import.pageTitle')).toBeInTheDocument();
      expect(screen.getByText('admin.import.pageDescription')).toBeInTheDocument();
    });
  });

  describe('File Upload and Validation', () => {
    it('should call validation API when file is selected', async () => {
      const validationResult = createSuccessValidationResult();
      const diffResult = createMixedDiffResult(2, 2, 2);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validationResult,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ diff: diffResult }),
        });

      renderImportWizard();

      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/import/validate',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    it('should show processing state during validation', async () => {
      let resolveValidation: any;
      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise((resolve) => {
          resolveValidation = resolve;
        })
      );

      renderImportWizard();

      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);

      // Wait for processing state
      await waitFor(() => {
        const uploadComponent = screen.getByTestId('step-1-upload');
        expect(uploadComponent.textContent).toContain('Processing...');
      }, { timeout: 1000 });

      // Clean up - resolve the promise to avoid memory leaks
      if (resolveValidation) {
        resolveValidation({
          ok: true,
          json: async () => createSuccessValidationResult(),
        });
      }
    });

    it('should advance to step 2 after successful validation and diff', async () => {
      const validationResult = createSuccessValidationResult();
      const diffResult = createMixedDiffResult(2, 2, 2);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validationResult,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ diff: diffResult }),
        });

      renderImportWizard();

      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        const stepIndicator = screen.getByTestId('step-indicator');
        expect(stepIndicator).toHaveAttribute('data-current-step', '2');
      });
    });

    it('should handle validation API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      renderImportWizard();

      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Validation Error',
            variant: 'destructive',
          })
        );
      });
    });

    it('should handle diff generation API failure', async () => {
      const validationResult = createSuccessValidationResult();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validationResult,
        })
        .mockResolvedValueOnce({
          ok: false,
        });

      renderImportWizard();

      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Preview Error',
            variant: 'destructive',
          })
        );
      });
    });
  });

  describe('Step 2 - Review', () => {
    const setupStep2 = async (hasErrors = false) => {
      const validationResult = hasErrors
        ? createErrorValidationResult(['E2', 'E3'])
        : createSuccessValidationResult();
      const diffResult = createMixedDiffResult(2, 2, 2);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validationResult,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ diff: diffResult }),
        });

      renderImportWizard();

      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByTestId('step-indicator')).toHaveAttribute('data-current-step', '2');
      });
    };

    it('should display validation errors when present', async () => {
      await setupStep2(true);

      expect(screen.getByTestId('step-2-validation')).toBeInTheDocument();
      expect(screen.getByText('2 errors')).toBeInTheDocument();
    });

    it('should display diff preview', async () => {
      await setupStep2(false);

      expect(screen.getByTestId('step-3-preview')).toBeInTheDocument();
      expect(screen.getByText('6 changes')).toBeInTheDocument();
    });

    it('should disable next button when errors exist', async () => {
      await setupStep2(true);

      const importButton = screen.getByText('admin.import.buttons.import');
      expect(importButton).toBeDisabled();
    });

    it('should enable next button when no errors and warnings acknowledged', async () => {
      // Use step 2 with warnings so the button is initially disabled
      const validationResult = createSuccessValidationResult();
      validationResult.warnings = [
        {
          code: 'W1',
          severity: 'warning',
          message: 'Test warning',
          sheet: 'Parts',
        },
      ];
      const diffResult = createMixedDiffResult(2, 2, 2);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validationResult,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ diff: diffResult }),
        });

      renderImportWizard();

      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByTestId('step-indicator')).toHaveAttribute('data-current-step', '2');
      });

      // Initially disabled (warnings not acknowledged)
      const importButton = screen.getByText('admin.import.buttons.import');
      expect(importButton).toBeDisabled();

      // Acknowledge warnings
      const checkbox = screen.getByTestId('acknowledge-preview-warnings');
      fireEvent.click(checkbox);

      // Should now be enabled
      await waitFor(() => {
        expect(importButton).not.toBeDisabled();
      });
    });

    it('should show back button', async () => {
      await setupStep2(false);

      expect(screen.getByText('admin.import.buttons.back')).toBeInTheDocument();
    });

    it('should navigate back to step 1 when back button clicked', async () => {
      await setupStep2(false);

      const backButton = screen.getByText('admin.import.buttons.back');
      fireEvent.click(backButton);

      const stepIndicator = screen.getByTestId('step-indicator');
      expect(stepIndicator).toHaveAttribute('data-current-step', '1');
    });
  });

  describe('Step Navigation via Indicator', () => {
    const setupStep2 = async () => {
      const validationResult = createSuccessValidationResult();
      const diffResult = createMixedDiffResult(2, 2, 2);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validationResult,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ diff: diffResult }),
        });

      renderImportWizard();

      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByTestId('step-indicator')).toHaveAttribute('data-current-step', '2');
      });
    };

    it('should allow clicking step 1 to go back from step 2', async () => {
      await setupStep2();

      const step1Button = screen.getByText('Step 1');
      fireEvent.click(step1Button);

      const stepIndicator = screen.getByTestId('step-indicator');
      expect(stepIndicator).toHaveAttribute('data-current-step', '1');
    });

    it('should not allow clicking step 3 when on step 2', async () => {
      await setupStep2();

      const step3Button = screen.getByText('Step 3');
      fireEvent.click(step3Button);

      const stepIndicator = screen.getByTestId('step-indicator');
      expect(stepIndicator).toHaveAttribute('data-current-step', '2'); // Should stay on 2
    });
  });

  describe('Step 3 - Execute Import', () => {
    const setupStep3 = async () => {
      const validationResult = createSuccessValidationResult();
      const diffResult = createMixedDiffResult(2, 2, 2);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validationResult,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ diff: diffResult }),
        });

      renderImportWizard();

      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByTestId('step-indicator')).toHaveAttribute('data-current-step', '2');
      });

      // Acknowledge warnings
      const checkbox = screen.getByTestId('acknowledge-preview-warnings');
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(screen.getByText('admin.import.buttons.import')).not.toBeDisabled();
      });

      return { validationResult, diffResult };
    };

    it('should call execute API when import button clicked', async () => {
      await setupStep3();

      const importResult = {
        success: true,
        importId: 'test-import-123',
        summary: {
          totalAdds: 2,
          totalUpdates: 2,
          totalDeletes: 2,
          totalChanges: 6,
        },
        executionTime: 1500,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => importResult,
      });

      const importButton = screen.getByText('admin.import.buttons.import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/import/execute',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    it('should advance to step 3 and execute import', async () => {
      await setupStep3();

      const importResult = {
        success: true,
        importId: 'test-import-123',
        summary: {
          totalAdds: 2,
          totalUpdates: 2,
          totalDeletes: 2,
          totalChanges: 6,
        },
        executionTime: 1500,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => importResult,
      });

      const importButton = screen.getByText('admin.import.buttons.import');
      fireEvent.click(importButton);

      await waitFor(() => {
        const stepIndicator = screen.getByTestId('step-indicator');
        expect(stepIndicator).toHaveAttribute('data-current-step', '3');
      });

      await waitFor(() => {
        expect(screen.getByText('Import completed: test-import-123')).toBeInTheDocument();
      });
    });

    it('should show success toast after successful import', async () => {
      await setupStep3();

      const importResult = {
        success: true,
        importId: 'test-import-123',
        summary: {
          totalAdds: 2,
          totalUpdates: 2,
          totalDeletes: 2,
          totalChanges: 6,
        },
        executionTime: 1500,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => importResult,
      });

      const importButton = screen.getByText('admin.import.buttons.import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Import Successful',
          })
        );
      });
    });

    it('should handle import execution failure', async () => {
      await setupStep3();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Database error', success: false }),
      });

      const importButton = screen.getByText('admin.import.buttons.import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Import Failed',
            variant: 'destructive',
          })
        );
      });
    });

    it('should hide navigation buttons after successful import', async () => {
      await setupStep3();

      const importResult = {
        success: true,
        importId: 'test-import-123',
        summary: {
          totalAdds: 2,
          totalUpdates: 2,
          totalDeletes: 2,
          totalChanges: 6,
        },
        executionTime: 1500,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => importResult,
      });

      const importButton = screen.getByText('admin.import.buttons.import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.queryByText('admin.import.buttons.import')).not.toBeInTheDocument();
        expect(screen.queryByText('admin.import.buttons.back')).not.toBeInTheDocument();
      });
    });
  });

  describe('Rollback Functionality', () => {
    const setupSuccessfulImport = async () => {
      const validationResult = createSuccessValidationResult();
      const diffResult = createMixedDiffResult(2, 2, 2);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validationResult,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ diff: diffResult }),
        });

      renderImportWizard();

      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByTestId('step-indicator')).toHaveAttribute('data-current-step', '2');
      });

      const checkbox = screen.getByTestId('acknowledge-preview-warnings');
      fireEvent.click(checkbox);

      const importResult = {
        success: true,
        importId: 'test-import-123',
        summary: {
          totalAdds: 2,
          totalUpdates: 2,
          totalDeletes: 2,
          totalChanges: 6,
        },
        executionTime: 1500,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => importResult,
      });

      const importButton = screen.getByText('admin.import.buttons.import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('Import completed: test-import-123')).toBeInTheDocument();
      });
    };

    it('should call rollback API when rollback button clicked', async () => {
      await setupSuccessfulImport();

      const rollbackResult = {
        success: true,
        message: 'Rollback successful',
        restoredCounts: {
          parts: 100,
          vehicleApplications: 200,
          crossReferences: 300,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => rollbackResult,
      });

      const rollbackButton = screen.getByText('Rollback');
      fireEvent.click(rollbackButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/import/rollback',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ importId: 'test-import-id' }),
          })
        );
      });
    });

    it('should show success toast after successful rollback', async () => {
      await setupSuccessfulImport();

      const rollbackResult = {
        success: true,
        message: 'Rollback successful',
        restoredCounts: {
          parts: 100,
          vehicleApplications: 200,
          crossReferences: 300,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => rollbackResult,
      });

      const rollbackButton = screen.getByText('Rollback');
      fireEvent.click(rollbackButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Rollback Successful',
          })
        );
      });
    });

    it('should navigate to admin page after successful rollback', async () => {
      await setupSuccessfulImport();

      const rollbackResult = {
        success: true,
        message: 'Rollback successful',
        restoredCounts: {
          parts: 100,
          vehicleApplications: 200,
          crossReferences: 300,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => rollbackResult,
      });

      const rollbackButton = screen.getByText('Rollback');
      fireEvent.click(rollbackButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/admin');
      });
    });

    it('should handle rollback failure', async () => {
      await setupSuccessfulImport();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Rollback failed', success: false }),
      });

      const rollbackButton = screen.getByText('Rollback');
      fireEvent.click(rollbackButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Rollback Failed',
            variant: 'destructive',
          })
        );
      });
    });
  });

  describe('Start New Import', () => {
    const setupSuccessfulImport = async () => {
      const validationResult = createSuccessValidationResult();
      const diffResult = createMixedDiffResult(2, 2, 2);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validationResult,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ diff: diffResult }),
        });

      renderImportWizard();

      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByTestId('step-indicator')).toHaveAttribute('data-current-step', '2');
      });

      const checkbox = screen.getByTestId('acknowledge-preview-warnings');
      fireEvent.click(checkbox);

      const importResult = {
        success: true,
        importId: 'test-import-123',
        summary: {
          totalAdds: 2,
          totalUpdates: 2,
          totalDeletes: 2,
          totalChanges: 6,
        },
        executionTime: 1500,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => importResult,
      });

      const importButton = screen.getByText('admin.import.buttons.import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('Import completed: test-import-123')).toBeInTheDocument();
      });
    };

    it('should reset wizard when start new import clicked', async () => {
      await setupSuccessfulImport();

      const startNewButton = screen.getByText('Start New Import');
      fireEvent.click(startNewButton);

      const stepIndicator = screen.getByTestId('step-indicator');
      expect(stepIndicator).toHaveAttribute('data-current-step', '1');
      expect(screen.getByTestId('step-1-upload')).toBeInTheDocument();
    });
  });

  describe('Cancel Navigation', () => {
    it('should navigate to admin page when cancel clicked', () => {
      renderImportWizard();

      const cancelButton = screen.getByText('admin.import.buttons.cancel');
      fireEvent.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  describe('Warning Acknowledgment', () => {
    const setupStep2WithWarnings = async () => {
      const validationResult = createSuccessValidationResult();
      validationResult.warnings = [
        {
          code: 'W1',
          severity: 'warning',
          message: 'Test warning',
          sheet: 'Parts',
        },
      ];
      const diffResult = createMixedDiffResult(2, 2, 2);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validationResult,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ diff: diffResult }),
        });

      renderImportWizard();

      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByTestId('step-indicator')).toHaveAttribute('data-current-step', '2');
      });
    };

    it('should update warnings acknowledged state', async () => {
      await setupStep2WithWarnings();

      const checkbox = screen.getByTestId('acknowledge-preview-warnings');
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(checkbox).toBeChecked();
      });
    });

    it('should require warnings acknowledgment before proceeding', async () => {
      await setupStep2WithWarnings();

      const importButton = screen.getByText('admin.import.buttons.import');
      expect(importButton).toBeDisabled();

      const checkbox = screen.getByTestId('acknowledge-preview-warnings');
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(importButton).not.toBeDisabled();
      });
    });
  });
});
