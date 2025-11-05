// ============================================================================
// ImportStep2DiffPreview Component Tests
// Tests diff preview display, pagination, and cascade warnings
// ============================================================================

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ImportStep2DiffPreview } from '../ImportStep2DiffPreview';
import {
  createEmptyDiffResult,
  createDiffResultWithAdds,
  createDiffResultWithUpdates,
  createDiffResultWithDeletes,
  createMixedDiffResult,
  createLargeDiffResult,
  createDiffResultWithSystemUpdates,
  createCascadeDeleteWarnings,
  createGeneralWarnings,
  createMockPart,
} from '@test-utils/component-mocks/diff-mocks';

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
  PlusCircle: () => <div data-testid="plus-circle-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  Info: () => <div data-testid="info-icon" />,
}));

describe('ImportStep2DiffPreview', () => {
  describe('Loading State', () => {
    it('should show loading spinner when isGeneratingDiff is true', () => {
      render(
        <ImportStep2DiffPreview
          diffResult={null}
          isGeneratingDiff={true}
        />
      );

      expect(screen.getByText('Calculating changes...')).toBeInTheDocument();
      expect(screen.getByText('admin.import.confirm.pleaseWait')).toBeInTheDocument();
    });

    it('should show loading animation', () => {
      const { container } = render(
        <ImportStep2DiffPreview
          diffResult={null}
          isGeneratingDiff={true}
        />
      );

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('No Diff Result', () => {
    it('should render nothing when diffResult is null and not generating', () => {
      const { container } = render(
        <ImportStep2DiffPreview
          diffResult={null}
          isGeneratingDiff={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Summary Bar', () => {
    it('should display summary counts for adds, updates, deletes', () => {
      const diffResult = createMixedDiffResult(5, 3, 2);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      expect(screen.getByText('5')).toBeInTheDocument(); // adds
      expect(screen.getByText('new')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // updates
      expect(screen.getByText('updated')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // deletes
      expect(screen.getByText('deleted')).toBeInTheDocument();
    });

    it('should show system updates count when present', () => {
      const diffResult = createDiffResultWithSystemUpdates();

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      expect(screen.getByText('8')).toBeInTheDocument(); // 5 vehicle + 3 cross-ref
      expect(screen.getByText('system updates')).toBeInTheDocument();
    });

    it('should not show system updates when count is 0', () => {
      const diffResult = createMixedDiffResult(2, 2, 2);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      expect(screen.queryByText('system updates')).not.toBeInTheDocument();
    });
  });

  describe('New Parts Section', () => {
    it('should display new parts count', () => {
      const diffResult = createDiffResultWithAdds(3);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      expect(screen.getByText(/New Parts \(3\)/)).toBeInTheDocument();
    });

    it('should display part details when expanded', () => {
      const diffResult = createDiffResultWithAdds(1);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      // Expand section
      const expandButton = screen.getByRole('button', { name: /New Parts/i });
      fireEvent.click(expandButton);

      expect(screen.getByText('ACR-ADD-1')).toBeInTheDocument();
    });

    it('should not display new parts section when count is 0', () => {
      const diffResult = createDiffResultWithUpdates(2);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      expect(screen.queryByText(/New Parts/)).not.toBeInTheDocument();
    });

    it('should toggle section expansion', () => {
      const diffResult = createDiffResultWithAdds(2);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      const expandButton = screen.getByRole('button', { name: /New Parts/i });

      // Initially collapsed - ACR-ADD-1 not visible
      expect(screen.queryByText('ACR-ADD-1')).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(expandButton);
      expect(screen.getByText('ACR-ADD-1')).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(expandButton);
      expect(screen.queryByText('ACR-ADD-1')).not.toBeInTheDocument();
    });
  });

  describe('Updated Parts Section', () => {
    it('should display updated parts count', () => {
      const diffResult = createDiffResultWithUpdates(5);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      expect(screen.getByText(/Updated Parts \(5\)/)).toBeInTheDocument();
    });

    it('should display update details when expanded', () => {
      const diffResult = createDiffResultWithUpdates(1);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      // Expand section
      const expandButton = screen.getByRole('button', { name: /Updated Parts/i });
      fireEvent.click(expandButton);

      expect(screen.getByText('ACR-UPD-1')).toBeInTheDocument();
    });

    it('should show field changes with before/after values', () => {
      const diffResult = createDiffResultWithUpdates(1);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      // Expand section
      const expandButton = screen.getByRole('button', { name: /Updated Parts/i });
      fireEvent.click(expandButton);

      expect(screen.getByText(/part type/i)).toBeInTheDocument();
      expect(screen.getByText(/"Rotor"/)).toBeInTheDocument();
      expect(screen.getByText(/"Pad"/)).toBeInTheDocument();
    });

    it('should not display updated parts section when count is 0', () => {
      const diffResult = createDiffResultWithAdds(2);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      expect(screen.queryByText(/Updated Parts/)).not.toBeInTheDocument();
    });
  });

  describe('Deleted Parts Section', () => {
    it('should display deleted parts count', () => {
      const diffResult = createDiffResultWithDeletes(4);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      expect(screen.getByText(/Deleted Parts \(4\)/)).toBeInTheDocument();
    });

    it('should display delete details when expanded', () => {
      const diffResult = createDiffResultWithDeletes(1);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      // Expand section
      const expandButton = screen.getByRole('button', { name: /Deleted Parts/i });
      fireEvent.click(expandButton);

      expect(screen.getByText('ACR-DEL-1')).toBeInTheDocument();
    });

    it('should not display deleted parts section when count is 0', () => {
      const diffResult = createDiffResultWithAdds(2);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      expect(screen.queryByText(/Deleted Parts/)).not.toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should display only first 20 items initially', () => {
      const diffResult = createDiffResultWithAdds(25);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      // Expand section
      const expandButton = screen.getByRole('button', { name: /New Parts/i });
      fireEvent.click(expandButton);

      // Should see first 20
      expect(screen.getByText('ACR-ADD-1')).toBeInTheDocument();
      expect(screen.getByText('ACR-ADD-20')).toBeInTheDocument();

      // Should NOT see 21st item
      expect(screen.queryByText('ACR-ADD-21')).not.toBeInTheDocument();
    });

    it('should show "Load 20 more" button when items exceed 20', () => {
      const diffResult = createDiffResultWithAdds(25);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      // Expand section
      const expandButton = screen.getByRole('button', { name: /New Parts/i });
      fireEvent.click(expandButton);

      expect(screen.getByText('Load 20 more')).toBeInTheDocument();
    });

    it('should show "Show all" button with total count', () => {
      const diffResult = createDiffResultWithAdds(25);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      // Expand section
      const expandButton = screen.getByRole('button', { name: /New Parts/i });
      fireEvent.click(expandButton);

      expect(screen.getByText('Show all 25')).toBeInTheDocument();
    });

    it('should load 20 more items when "Load 20 more" is clicked', () => {
      const diffResult = createDiffResultWithAdds(50);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      // Expand section
      const expandButton = screen.getByRole('button', { name: /New Parts/i });
      fireEvent.click(expandButton);

      // Click "Load 20 more"
      const loadMoreButton = screen.getByText('Load 20 more');
      fireEvent.click(loadMoreButton);

      // Should now see items 1-40
      expect(screen.getByText('ACR-ADD-40')).toBeInTheDocument();
      expect(screen.queryByText('ACR-ADD-41')).not.toBeInTheDocument();
    });

    it('should show all items when "Show all" is clicked', () => {
      const diffResult = createDiffResultWithAdds(30);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      // Expand section
      const expandButton = screen.getByRole('button', { name: /New Parts/i });
      fireEvent.click(expandButton);

      // Click "Show all"
      const showAllButton = screen.getByText('Show all 30');
      fireEvent.click(showAllButton);

      // Should see all items
      expect(screen.getByText('ACR-ADD-1')).toBeInTheDocument();
      expect(screen.getByText('ACR-ADD-30')).toBeInTheDocument();

      // Pagination buttons should be gone
      expect(screen.queryByText('Load 20 more')).not.toBeInTheDocument();
      expect(screen.queryByText('Show all 30')).not.toBeInTheDocument();
    });

    it('should not show pagination buttons when items <= 20', () => {
      const diffResult = createDiffResultWithAdds(15);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      // Expand section
      const expandButton = screen.getByRole('button', { name: /New Parts/i });
      fireEvent.click(expandButton);

      expect(screen.queryByText('Load 20 more')).not.toBeInTheDocument();
      expect(screen.queryByText(/Show all/)).not.toBeInTheDocument();
    });

    it('should apply pagination independently to updates section', () => {
      const diffResult = createDiffResultWithUpdates(25);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      // Expand updates section
      const expandButton = screen.getByRole('button', { name: /Updated Parts/i });
      fireEvent.click(expandButton);

      expect(screen.getByText('ACR-UPD-20')).toBeInTheDocument();
      expect(screen.queryByText('ACR-UPD-21')).not.toBeInTheDocument();
      expect(screen.getByText('Load 20 more')).toBeInTheDocument();
    });

    it('should apply pagination independently to deletes section', () => {
      const diffResult = createDiffResultWithDeletes(30);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      // Expand deletes section
      const expandButton = screen.getByRole('button', { name: /Deleted Parts/i });
      fireEvent.click(expandButton);

      expect(screen.getByText('ACR-DEL-20')).toBeInTheDocument();
      expect(screen.queryByText('ACR-DEL-21')).not.toBeInTheDocument();
      expect(screen.getByText('Load 20 more')).toBeInTheDocument();
    });
  });

  describe('Cascade Delete Warnings', () => {
    it('should display cascade warning when parts are deleted', () => {
      const diffResult = createDiffResultWithDeletes(2);
      const warnings = createCascadeDeleteWarnings('ACR-DEL-1');

      render(
        <ImportStep2DiffPreview
          diffResult={diffResult}
          validationWarnings={warnings}
        />
      );

      expect(screen.getByText('Cascade Delete Warning')).toBeInTheDocument();
    });

    it('should show count of cascade-deleted items', () => {
      const diffResult = createDiffResultWithDeletes(2);
      const warnings = createCascadeDeleteWarnings('ACR-DEL-1');

      render(
        <ImportStep2DiffPreview
          diffResult={diffResult}
          validationWarnings={warnings}
        />
      );

      expect(screen.getByText(/3 related items/)).toBeInTheDocument();
    });

    it('should show acknowledgment checkbox for cascade deletes', () => {
      const diffResult = createDiffResultWithDeletes(1);
      const warnings = createCascadeDeleteWarnings('ACR-DEL-1');
      const mockAcknowledge = jest.fn();

      render(
        <ImportStep2DiffPreview
          diffResult={diffResult}
          validationWarnings={warnings}
          onAcknowledgeWarnings={mockAcknowledge}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(screen.getByText(/I understand these items will be permanently removed/)).toBeInTheDocument();
    });

    it('should call onAcknowledgeWarnings when cascade checkbox is toggled', () => {
      const diffResult = createDiffResultWithDeletes(1);
      const warnings = createCascadeDeleteWarnings('ACR-DEL-1');
      const mockAcknowledge = jest.fn();

      render(
        <ImportStep2DiffPreview
          diffResult={diffResult}
          validationWarnings={warnings}
          onAcknowledgeWarnings={mockAcknowledge}
          warningsAcknowledged={false}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(mockAcknowledge).toHaveBeenCalledWith(true);
    });

    it('should not show cascade warning when no deletes', () => {
      const diffResult = createDiffResultWithAdds(2);
      const warnings = createCascadeDeleteWarnings('ACR-DEL-1');

      render(
        <ImportStep2DiffPreview
          diffResult={diffResult}
          validationWarnings={warnings}
        />
      );

      expect(screen.queryByText('Cascade Delete Warning')).not.toBeInTheDocument();
    });

    it('should show cascade details in delete items when expanded', () => {
      const diffResult = createDiffResultWithDeletes(1);
      const warnings = createCascadeDeleteWarnings('ACR-DEL-1');

      render(
        <ImportStep2DiffPreview
          diffResult={diffResult}
          validationWarnings={warnings}
        />
      );

      // Expand deleted parts section
      const expandButton = screen.getByRole('button', { name: /Deleted Parts/i });
      fireEvent.click(expandButton);

      // Should see cascade summary
      expect(screen.getByText(/Will also remove/)).toBeInTheDocument();
      expect(screen.getByText(/2 vehicle applications/)).toBeInTheDocument();
      expect(screen.getByText(/1 cross-reference/)).toBeInTheDocument();
    });
  });

  describe('General Warnings', () => {
    it('should display general warnings when no cascade deletes', () => {
      const diffResult = createDiffResultWithUpdates(2);
      const warnings = createGeneralWarnings();

      render(
        <ImportStep2DiffPreview
          diffResult={diffResult}
          validationWarnings={warnings}
          onAcknowledgeWarnings={jest.fn()}
        />
      );

      expect(screen.getByText(/Data Change Warnings \(2\)/)).toBeInTheDocument();
    });

    it('should display individual warning messages', () => {
      const diffResult = createDiffResultWithUpdates(2);
      const warnings = createGeneralWarnings();

      render(
        <ImportStep2DiffPreview
          diffResult={diffResult}
          validationWarnings={warnings}
          onAcknowledgeWarnings={jest.fn()}
        />
      );

      expect(screen.getByText(/ACR SKU will be modified/)).toBeInTheDocument();
      expect(screen.getByText(/Part type will be changed/)).toBeInTheDocument();
    });

    it('should show acknowledgment checkbox for general warnings', () => {
      const diffResult = createDiffResultWithUpdates(2);
      const warnings = createGeneralWarnings();

      render(
        <ImportStep2DiffPreview
          diffResult={diffResult}
          validationWarnings={warnings}
          onAcknowledgeWarnings={jest.fn()}
        />
      );

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByText(/I understand these changes and want to proceed/)).toBeInTheDocument();
    });

    it('should not show general warnings when cascade warnings present', () => {
      const diffResult = createDiffResultWithDeletes(1);
      const cascadeWarnings = createCascadeDeleteWarnings('ACR-DEL-1');
      const generalWarnings = createGeneralWarnings();
      const allWarnings = [...cascadeWarnings, ...generalWarnings];

      render(
        <ImportStep2DiffPreview
          diffResult={diffResult}
          validationWarnings={allWarnings}
          onAcknowledgeWarnings={jest.fn()}
        />
      );

      // Should show cascade warning
      expect(screen.getByText('Cascade Delete Warning')).toBeInTheDocument();

      // Should NOT show general warnings section
      expect(screen.queryByText(/Data Change Warnings/)).not.toBeInTheDocument();
    });
  });

  describe('System Updates Section', () => {
    it('should display collapsed system updates section', () => {
      const diffResult = createDiffResultWithSystemUpdates();

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      expect(screen.getByText(/8 system metadata updates/)).toBeInTheDocument();
    });

    it('should expand system updates when clicked', () => {
      const diffResult = createDiffResultWithSystemUpdates();

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      const expandButton = screen.getByRole('button', { name: /system metadata updates/i });

      // Initially collapsed
      expect(screen.queryByText(/vehicle application metadata syncs/)).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(expandButton);

      expect(screen.getByText(/5 vehicle application metadata syncs/)).toBeInTheDocument();
      expect(screen.getByText(/3 cross-reference metadata syncs/)).toBeInTheDocument();
    });

    it('should collapse system updates when clicked again', () => {
      const diffResult = createDiffResultWithSystemUpdates();

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      const expandButton = screen.getByRole('button', { name: /system metadata updates/i });

      // Expand
      fireEvent.click(expandButton);
      expect(screen.getByText(/vehicle application metadata syncs/)).toBeInTheDocument();

      // Collapse
      fireEvent.click(expandButton);
      expect(screen.queryByText(/vehicle application metadata syncs/)).not.toBeInTheDocument();
    });

    it('should not show system updates section when count is 0', () => {
      const diffResult = createMixedDiffResult(2, 2, 2);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      expect(screen.queryByText(/system metadata updates/)).not.toBeInTheDocument();
    });
  });

  describe('Part Details Display', () => {
    it('should display part type in part details', () => {
      const diffResult = createDiffResultWithAdds(1);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      const expandButton = screen.getByRole('button', { name: /New Parts/i });
      fireEvent.click(expandButton);

      expect(screen.getByText(/Rotor/)).toBeInTheDocument();
    });

    it('should display specifications when present', () => {
      const diffResult = createDiffResultWithAdds(1);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      const expandButton = screen.getByRole('button', { name: /New Parts/i });
      fireEvent.click(expandButton);

      expect(screen.getByText(/Premium brake rotor/)).toBeInTheDocument();
    });

    it('should display multiple part properties separated by ·', () => {
      const diffResult = createDiffResultWithAdds(1);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      const expandButton = screen.getByRole('button', { name: /New Parts/i });
      fireEvent.click(expandButton);

      // Should see properties separated by middle dot
      const detailsText = screen.getByText(/Rotor.*·.*Front.*·.*With ABS/);
      expect(detailsText).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display summary bar with all zeros for empty diff', () => {
      const diffResult = createEmptyDiffResult();

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      // Check for summary bar content with multiple zeros
      expect(screen.getByText('new')).toBeInTheDocument();
      expect(screen.getByText('updated')).toBeInTheDocument();
      expect(screen.getByText('deleted')).toBeInTheDocument();

      // All counts should be 0
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(3); // At least adds, updates, deletes
    });

    it('should not display any change sections for empty diff', () => {
      const diffResult = createEmptyDiffResult();

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      expect(screen.queryByText(/New Parts/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Updated Parts/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Deleted Parts/)).not.toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should display plus circle icon for additions', () => {
      const diffResult = createDiffResultWithAdds(1);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      const icons = screen.getAllByTestId('plus-circle-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should display edit icon for updates', () => {
      const diffResult = createDiffResultWithUpdates(1);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      const icons = screen.getAllByTestId('edit-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should display trash icon for deletes', () => {
      const diffResult = createDiffResultWithDeletes(1);

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      const icons = screen.getAllByTestId('trash-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should display info icon for system updates', () => {
      const diffResult = createDiffResultWithSystemUpdates();

      render(<ImportStep2DiffPreview diffResult={diffResult} />);

      const icons = screen.getAllByTestId('info-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should display alert triangle icon for warnings', () => {
      const diffResult = createDiffResultWithDeletes(1);
      const warnings = createCascadeDeleteWarnings('ACR-DEL-1');

      render(
        <ImportStep2DiffPreview
          diffResult={diffResult}
          validationWarnings={warnings}
        />
      );

      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });
  });
});
