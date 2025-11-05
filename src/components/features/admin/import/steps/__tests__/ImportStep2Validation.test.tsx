// ============================================================================
// ImportStep2Validation Component Tests
// Tests error/warning display, sheet grouping, and acknowledgment
// ============================================================================

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ImportStep2Validation } from '../ImportStep2Validation';
import {
  createSuccessValidationResult,
  createErrorValidationResult,
  createWarningValidationResult,
  createMixedValidationResult,
  createMultiSheetErrorResult,
  createMultiSheetWarningResult,
  createMockError,
  createMockWarning,
  createMockValidationResult,
  ALL_ERROR_CODES,
  ALL_WARNING_CODES,
} from '@test-utils/component-mocks/validation-mocks';

// Mock the LocaleContext
jest.mock('@/contexts/LocaleContext', () => ({
  useLocale: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: jest.fn(),
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
}));

describe('ImportStep2Validation', () => {
  describe('Loading State', () => {
    it('should show loading spinner when isValidating is true', () => {
      render(
        <ImportStep2Validation
          validationResult={null}
          isValidating={true}
        />
      );

      expect(screen.getByText('admin.import.validation.validating')).toBeInTheDocument();
      expect(screen.getByText('admin.import.confirm.pleaseWait')).toBeInTheDocument();
    });

    it('should show loading animation', () => {
      const { container } = render(
        <ImportStep2Validation
          validationResult={null}
          isValidating={true}
        />
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('No Validation Result', () => {
    it('should render nothing when validationResult is null and not validating', () => {
      const { container } = render(
        <ImportStep2Validation
          validationResult={null}
          isValidating={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Successful Validation (No Errors/Warnings)', () => {
    it('should show success message when validation passes', () => {
      const result = createSuccessValidationResult();

      render(<ImportStep2Validation validationResult={result} />);

      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('Validation Successful')).toBeInTheDocument();
      expect(screen.getByText('All data is valid. Ready to preview changes.')).toBeInTheDocument();
    });

    it('should not show error or warning sections', () => {
      const result = createSuccessValidationResult();

      render(<ImportStep2Validation validationResult={result} />);

      expect(screen.queryByTestId('alert-circle-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display error summary with count', () => {
      const result = createErrorValidationResult(['E2', 'E3', 'E4']);

      render(<ImportStep2Validation validationResult={result} />);

      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      expect(screen.getByText(/admin.import.validation.failed/)).toBeInTheDocument();
      expect(screen.getByText(/admin.import.validation.errorsFound/)).toBeInTheDocument();
    });

    it('should display error code badge', () => {
      const result = createErrorValidationResult(['E2']);

      render(<ImportStep2Validation validationResult={result} />);

      // Expand the sheet to see error details
      const sheetButton = screen.getByRole('button', { name: /Parts/i });
      fireEvent.click(sheetButton);

      expect(screen.getByText('E2')).toBeInTheDocument();
    });

    it('should display error row and column information', () => {
      const result = createMockValidationResult({
        errors: [
          createMockError({
            code: 'E2',
            row: 42,
            column: 'ACR_SKU',
            message: 'Duplicate SKU found',
          }),
        ],
      });

      render(<ImportStep2Validation validationResult={result} />);

      // Expand the sheet to see details
      const sheetButton = screen.getByRole('button', { name: /Parts/i });
      fireEvent.click(sheetButton);

      expect(screen.getByText(/Row 42/)).toBeInTheDocument();
      expect(screen.getByText(/Column.*ACR_SKU/)).toBeInTheDocument();
    });

    it('should display error message', () => {
      const result = createMockValidationResult({
        errors: [
          createMockError({
            code: 'E2',
            message: 'Duplicate ACR SKU found',
          }),
        ],
      });

      render(<ImportStep2Validation validationResult={result} />);

      // Expand sheet
      const sheetButton = screen.getByRole('button', { name: /Parts/i });
      fireEvent.click(sheetButton);

      expect(screen.getByText('Duplicate ACR SKU found')).toBeInTheDocument();
    });

    it('should display error value when provided', () => {
      const result = createMockValidationResult({
        errors: [
          createMockError({
            code: 'E2',
            value: 'ACR-DUPLICATE',
          }),
        ],
      });

      render(<ImportStep2Validation validationResult={result} />);

      // Expand sheet
      const sheetButton = screen.getByRole('button', { name: /Parts/i });
      fireEvent.click(sheetButton);

      expect(screen.getByText(/Value:/)).toBeInTheDocument();
      expect(screen.getByText('ACR-DUPLICATE')).toBeInTheDocument();
    });

    it('should group errors by sheet', () => {
      const result = createMultiSheetErrorResult();

      render(<ImportStep2Validation validationResult={result} />);

      expect(screen.getByText('Parts')).toBeInTheDocument();
      expect(screen.getByText('Vehicle Applications')).toBeInTheDocument();
      expect(screen.getByText('Cross References')).toBeInTheDocument();
    });

    it('should show error count per sheet', () => {
      const result = createMultiSheetErrorResult();

      render(<ImportStep2Validation validationResult={result} />);

      // Parts sheet has 2 errors
      const partsSection = screen.getByText('Parts').closest('button');
      expect(within(partsSection!).getByText('2 errors')).toBeInTheDocument();

      // Vehicle Applications has 2 errors
      const vehicleSection = screen.getByText('Vehicle Applications').closest('button');
      expect(within(vehicleSection!).getByText('2 errors')).toBeInTheDocument();

      // Cross References has 1 error
      const crossRefSection = screen.getByText('Cross References').closest('button');
      expect(within(crossRefSection!).getByText('1 error')).toBeInTheDocument();
    });

    it('should toggle sheet expansion on click', () => {
      const result = createErrorValidationResult(['E2']);

      render(<ImportStep2Validation validationResult={result} />);

      const sheetButton = screen.getByRole('button', { name: /Parts/i });

      // Initially collapsed
      expect(screen.queryByText('Error E2 occurred')).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(sheetButton);
      expect(screen.getByText('Error E2 occurred')).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(sheetButton);
      expect(screen.queryByText('Error E2 occurred')).not.toBeInTheDocument();
    });
  });

  describe('Warning Display', () => {
    it('should display warning summary with count', () => {
      const result = createWarningValidationResult(['W1', 'W2']);

      render(<ImportStep2Validation validationResult={result} />);

      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByText(/admin.import.validation.warningsFound/)).toBeInTheDocument();
    });

    it('should display warning code badge', () => {
      const result = createWarningValidationResult(['W1']);

      render(<ImportStep2Validation validationResult={result} />);

      // Expand the sheet to see warning details
      const sheetButton = screen.getByRole('button', { name: /Parts/i });
      fireEvent.click(sheetButton);

      expect(screen.getByText('W1')).toBeInTheDocument();
    });

    it('should display warning before/after values', () => {
      const result = createMockValidationResult({
        valid: true,
        warnings: [
          createMockWarning({
            code: 'W1',
            expected: 'Old Value',
            value: 'New Value',
          }),
        ],
      });

      render(<ImportStep2Validation validationResult={result} />);

      // Expand sheet
      const sheetButton = screen.getByRole('button', { name: /Parts/i });
      fireEvent.click(sheetButton);

      expect(screen.getByText(/Before:/)).toBeInTheDocument();
      expect(screen.getByText('Old Value')).toBeInTheDocument();
      expect(screen.getByText(/After:/)).toBeInTheDocument();
      expect(screen.getByText('New Value')).toBeInTheDocument();
    });

    it('should limit warnings display to 10 per sheet', () => {
      const warnings = Array.from({ length: 15 }, (_, i) =>
        createMockWarning({
          code: `W${i + 1}`,
          row: i + 1,
          message: `Warning ${i + 1}`,
        })
      );

      const result = createMockValidationResult({
        valid: true,
        warnings,
      });

      render(<ImportStep2Validation validationResult={result} />);

      // Expand sheet
      const sheetButton = screen.getByRole('button', { name: /Parts/i });
      fireEvent.click(sheetButton);

      // Should show "and 5 more warnings"
      expect(screen.getByText(/... and 5 more warnings/)).toBeInTheDocument();
    });

    it('should show warning acknowledgment checkbox', () => {
      const result = createWarningValidationResult(['W1']);

      render(<ImportStep2Validation validationResult={result} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should call onAcknowledgeWarnings when checkbox is toggled', () => {
      const result = createWarningValidationResult(['W1']);
      const mockAcknowledge = jest.fn();

      const { rerender } = render(
        <ImportStep2Validation
          validationResult={result}
          onAcknowledgeWarnings={mockAcknowledge}
          warningsAcknowledged={false}
        />
      );

      const checkbox = screen.getByRole('checkbox');

      // First click: unchecked → checked
      fireEvent.click(checkbox);
      expect(mockAcknowledge).toHaveBeenCalledWith(true);

      // Re-render with updated state
      rerender(
        <ImportStep2Validation
          validationResult={result}
          onAcknowledgeWarnings={mockAcknowledge}
          warningsAcknowledged={true}
        />
      );

      // Second click: checked → unchecked
      fireEvent.click(screen.getByRole('checkbox'));
      expect(mockAcknowledge).toHaveBeenCalledWith(false);
    });

    it('should reflect warningsAcknowledged prop state', () => {
      const result = createWarningValidationResult(['W1']);

      const { rerender } = render(
        <ImportStep2Validation
          validationResult={result}
          warningsAcknowledged={false}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      rerender(
        <ImportStep2Validation
          validationResult={result}
          warningsAcknowledged={true}
        />
      );

      expect(checkbox).toBeChecked();
    });
  });

  describe('Mixed Errors and Warnings', () => {
    it('should display both errors and warnings', () => {
      const result = createMixedValidationResult(['E2', 'E3'], ['W1', 'W2']);

      render(<ImportStep2Validation validationResult={result} />);

      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('should not show success message when errors exist', () => {
      const result = createMixedValidationResult(['E2'], ['W1']);

      render(<ImportStep2Validation validationResult={result} />);

      expect(screen.queryByText('Validation Successful')).not.toBeInTheDocument();
    });

    it('should show acknowledgment checkbox even when errors exist', () => {
      const result = createMixedValidationResult(['E2'], ['W1']);

      render(<ImportStep2Validation validationResult={result} />);

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });
  });

  describe('All Error Codes Coverage', () => {
    ALL_ERROR_CODES.forEach((errorCode) => {
      it(`should display error code ${errorCode}`, () => {
        const result = createErrorValidationResult([errorCode]);

        render(<ImportStep2Validation validationResult={result} />);

        // Expand the sheet to see error code
        const sheetButton = screen.getByRole('button', { name: /Parts/i });
        fireEvent.click(sheetButton);

        expect(screen.getByText(errorCode)).toBeInTheDocument();
      });
    });
  });

  describe('All Warning Codes Coverage', () => {
    ALL_WARNING_CODES.forEach((warningCode) => {
      it(`should display warning code ${warningCode}`, () => {
        const result = createWarningValidationResult([warningCode]);

        render(<ImportStep2Validation validationResult={result} />);

        // Expand the sheet to see warning code
        const sheetButton = screen.getByRole('button', { name: /Parts/i });
        fireEvent.click(sheetButton);

        expect(screen.getByText(warningCode)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors with no sheet information (grouped as "General")', () => {
      const result = createMockValidationResult({
        errors: [
          createMockError({
            code: 'E1',
            sheet: undefined,
            message: 'General validation error',
          }),
        ],
      });

      render(<ImportStep2Validation validationResult={result} />);

      expect(screen.getByText('General')).toBeInTheDocument();
    });

    it('should handle warnings with no sheet information', () => {
      const result = createMockValidationResult({
        valid: true,
        warnings: [
          createMockWarning({
            code: 'W1',
            sheet: undefined,
            message: 'General warning',
          }),
        ],
      });

      render(<ImportStep2Validation validationResult={result} />);

      expect(screen.getByText('General')).toBeInTheDocument();
    });

    it('should handle error with no row information', () => {
      const result = createMockValidationResult({
        errors: [
          createMockError({
            code: 'E1',
            row: undefined,
            message: 'Sheet-level error',
          }),
        ],
      });

      render(<ImportStep2Validation validationResult={result} />);

      const sheetButton = screen.getByRole('button', { name: /Parts/i });
      fireEvent.click(sheetButton);

      // Should not crash, just not show row number
      expect(screen.getByText('Sheet-level error')).toBeInTheDocument();
    });

    it('should handle error with no value', () => {
      const result = createMockValidationResult({
        errors: [
          createMockError({
            code: 'E3',
            value: undefined,
            message: 'Empty required field',
          }),
        ],
      });

      render(<ImportStep2Validation validationResult={result} />);

      const sheetButton = screen.getByRole('button', { name: /Parts/i });
      fireEvent.click(sheetButton);

      expect(screen.getByText('Empty required field')).toBeInTheDocument();
      expect(screen.queryByText(/Value:/)).not.toBeInTheDocument();
    });
  });
});
