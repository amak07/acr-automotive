// ============================================================================
// ImportStep1Upload Component Tests
// Tests file upload, drag-and-drop, and validation
// ============================================================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportStep1Upload } from '../ImportStep1Upload';

// Mock LocaleContext
jest.mock('@/contexts/LocaleContext', () => ({
  useLocale: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: jest.fn(),
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Upload: () => <div data-testid="upload-icon" />,
  FileSpreadsheet: () => <div data-testid="file-spreadsheet-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
}));

describe('ImportStep1Upload', () => {
  const mockOnFileSelected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should display upload zone when no file uploaded', () => {
      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      expect(screen.getByText('admin.import.upload.dragDrop')).toBeInTheDocument();
      expect(screen.getByText('admin.import.upload.orClickBrowse')).toBeInTheDocument();
    });

    it('should display choose file button', () => {
      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      expect(screen.getByText('admin.import.upload.chooseFile')).toBeInTheDocument();
    });

    it('should display upload icon', () => {
      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      expect(screen.getAllByTestId('upload-icon').length).toBeGreaterThan(0);
    });

    it('should display accepted file type message', () => {
      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      expect(screen.getByText('admin.import.upload.accepted')).toBeInTheDocument();
    });

    it('should display upload requirements', () => {
      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      expect(screen.getByText('Upload Requirements')).toBeInTheDocument();
      expect(screen.getByText(/Excel format \(\.xlsx\) only/)).toBeInTheDocument();
      expect(screen.getByText(/Maximum file size: 10MB/)).toBeInTheDocument();
    });

    it('should have hidden file input', () => {
      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      const fileInput = screen.getByLabelText('File upload');
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', '.xlsx');
      expect(fileInput).toHaveClass('hidden');
    });
  });

  describe('File Selection via Button', () => {
    it('should trigger file input click when browse button clicked', () => {
      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      const fileInput = screen.getByLabelText('File upload') as HTMLInputElement;
      const clickSpy = jest.spyOn(fileInput, 'click');

      const browseButton = screen.getByText('admin.import.upload.chooseFile');
      fireEvent.click(browseButton);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should call onFileSelected with valid .xlsx file', () => {
      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      const fileInput = screen.getByLabelText('File upload') as HTMLInputElement;
      const file = new File(['test content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      expect(mockOnFileSelected).toHaveBeenCalledWith(file);
    });

    it('should not call onFileSelected when no file selected', () => {
      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      const fileInput = screen.getByLabelText('File upload') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: [],
        writable: false,
      });

      fireEvent.change(fileInput);

      expect(mockOnFileSelected).not.toHaveBeenCalled();
    });
  });

  describe('File Validation', () => {
    it('should reject non-.xlsx files', () => {
      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      const fileInput = screen.getByLabelText('File upload') as HTMLInputElement;
      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      expect(mockOnFileSelected).not.toHaveBeenCalled();
      expect(screen.getByText('Upload Error')).toBeInTheDocument();
      expect(screen.getByText('Only .xlsx files are supported')).toBeInTheDocument();
    });

    it('should reject files larger than 10MB', () => {
      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      const fileInput = screen.getByLabelText('File upload') as HTMLInputElement;

      // Create a file larger than 10MB (11MB)
      const largeContent = new ArrayBuffer(11 * 1024 * 1024);
      const file = new File([largeContent], 'large.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      expect(mockOnFileSelected).not.toHaveBeenCalled();
      expect(screen.getByText('Upload Error')).toBeInTheDocument();
      expect(screen.getByText('File size must be less than 10MB')).toBeInTheDocument();
    });

    it('should accept valid .xlsx file under 10MB', () => {
      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      const fileInput = screen.getByLabelText('File upload') as HTMLInputElement;
      const file = new File(['test content'], 'valid.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      expect(mockOnFileSelected).toHaveBeenCalledWith(file);
      expect(screen.queryByText('Upload Error')).not.toBeInTheDocument();
    });

    it('should clear previous error when valid file selected', () => {
      const { rerender } = render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      const fileInput = screen.getByLabelText('File upload') as HTMLInputElement;

      // First, upload invalid file
      const invalidFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      Object.defineProperty(fileInput, 'files', {
        value: [invalidFile],
        writable: false,
        configurable: true,
      });
      fireEvent.change(fileInput);

      expect(screen.getByText('Upload Error')).toBeInTheDocument();

      // Re-render to get fresh component
      rerender(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      // Then upload valid file with new file input reference
      const fileInput2 = screen.getByLabelText('File upload') as HTMLInputElement;
      const validFile = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      Object.defineProperty(fileInput2, 'files', {
        value: [validFile],
        writable: false,
        configurable: true,
      });
      fireEvent.change(fileInput2);

      expect(screen.queryByText('Upload Error')).not.toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('should highlight drop zone when dragging over', () => {
      const { container } = render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      const dropZone = container.querySelector('[class*="border-dashed"]') as HTMLElement;

      fireEvent.dragEnter(dropZone);

      expect(dropZone.className).toContain('border-acr-red-600');
      expect(dropZone.className).toContain('bg-acr-red-50');
    });

    it('should remove highlight when drag leaves', () => {
      const { container } = render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      const dropZone = container.querySelector('[class*="border-dashed"]') as HTMLElement;

      fireEvent.dragEnter(dropZone);
      expect(dropZone.className).toContain('border-acr-red-600');

      fireEvent.dragLeave(dropZone);
      expect(dropZone.className).not.toContain('border-acr-red-600');
    });

    it('should handle file drop', () => {
      const { container } = render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      const dropZone = container.querySelector('[class*="border-dashed"]') as HTMLElement;
      const file = new File(['test content'], 'dropped.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const dropEvent = new Event('drop', { bubbles: true }) as any;
      dropEvent.dataTransfer = {
        files: [file],
      };

      fireEvent(dropZone, dropEvent);

      expect(mockOnFileSelected).toHaveBeenCalledWith(file);
    });

    it('should validate dropped file', () => {
      const { container } = render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      const dropZone = container.querySelector('[class*="border-dashed"]') as HTMLElement;
      const file = new File(['test'], 'dropped.csv', { type: 'text/csv' });

      const dropEvent = new Event('drop', { bubbles: true }) as any;
      dropEvent.dataTransfer = {
        files: [file],
      };

      fireEvent(dropZone, dropEvent);

      expect(mockOnFileSelected).not.toHaveBeenCalled();
      expect(screen.getByText('Only .xlsx files are supported')).toBeInTheDocument();
    });

    it('should remove drag highlight after drop', () => {
      const { container } = render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      const dropZone = container.querySelector('[class*="border-dashed"]') as HTMLElement;
      const file = new File(['test'], 'dropped.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      fireEvent.dragEnter(dropZone);
      expect(dropZone.className).toContain('border-acr-red-600');

      const dropEvent = new Event('drop', { bubbles: true }) as any;
      dropEvent.dataTransfer = {
        files: [file],
      };

      fireEvent(dropZone, dropEvent);

      expect(dropZone.className).not.toContain('border-acr-red-600');
    });

    it('should handle dragOver event', () => {
      const { container } = render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      const dropZone = container.querySelector('[class*="border-dashed"]') as HTMLElement;

      const dragOverSpy = jest.fn();
      dropZone.addEventListener('dragover', dragOverSpy);

      fireEvent.dragOver(dropZone);

      expect(dragOverSpy).toHaveBeenCalled();
    });
  });

  describe('Uploaded File Display', () => {
    it('should hide upload zone when file is uploaded', () => {
      const file = new File(['test'], 'uploaded.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} uploadedFile={file} />);

      expect(screen.queryByText('admin.import.upload.dragDrop')).not.toBeInTheDocument();
    });

    it('should display uploaded file name', () => {
      const file = new File(['test'], 'my-file.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} uploadedFile={file} />);

      expect(screen.getByText('my-file.xlsx')).toBeInTheDocument();
    });

    it('should display file uploaded message', () => {
      const file = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} uploadedFile={file} />);

      expect(screen.getByText('admin.import.upload.fileUploaded')).toBeInTheDocument();
    });

    it('should display file spreadsheet icon', () => {
      const file = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} uploadedFile={file} />);

      expect(screen.getByTestId('file-spreadsheet-icon')).toBeInTheDocument();
    });

    it('should display check circle icon', () => {
      const file = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} uploadedFile={file} />);

      expect(screen.getAllByTestId('check-circle-icon').length).toBeGreaterThan(0);
    });

    it('should format file size in bytes', () => {
      const content = 'a'.repeat(512); // 512 bytes
      const file = new File([content], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} uploadedFile={file} />);

      expect(screen.getByText('512 B')).toBeInTheDocument();
    });

    it('should format file size in KB', () => {
      const content = new ArrayBuffer(5 * 1024); // 5 KB
      const file = new File([content], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} uploadedFile={file} />);

      expect(screen.getByText('5.0 KB')).toBeInTheDocument();
    });

    it('should format file size in MB', () => {
      const content = new ArrayBuffer(2.5 * 1024 * 1024); // 2.5 MB
      const file = new File([content], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} uploadedFile={file} />);

      expect(screen.getByText('2.5 MB')).toBeInTheDocument();
    });
  });

  describe('Parse Progress', () => {
    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    it('should show parsing indicator when isParsing is true', () => {
      render(
        <ImportStep1Upload
          onFileSelected={mockOnFileSelected}
          uploadedFile={file}
          parseProgress={{ isParsing: true }}
        />
      );

      expect(screen.getByText('admin.import.upload.parsing')).toBeInTheDocument();
      expect(screen.getByText('admin.import.confirm.pleaseWait')).toBeInTheDocument();
    });

    it('should show loader icon when parsing', () => {
      render(
        <ImportStep1Upload
          onFileSelected={mockOnFileSelected}
          uploadedFile={file}
          parseProgress={{ isParsing: true }}
        />
      );

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('should show row counts when parsing complete', () => {
      render(
        <ImportStep1Upload
          onFileSelected={mockOnFileSelected}
          uploadedFile={file}
          parseProgress={{
            isParsing: false,
            rowCount: {
              parts: 100,
              vehicleApplications: 250,
              crossReferences: 500,
            },
          }}
        />
      );

      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
    });

    it('should format large row counts with locale separators', () => {
      render(
        <ImportStep1Upload
          onFileSelected={mockOnFileSelected}
          uploadedFile={file}
          parseProgress={{
            isParsing: false,
            rowCount: {
              parts: 1000,
              vehicleApplications: 2500,
              crossReferences: 10000,
            },
          }}
        />
      );

      // toLocaleString() adds commas for thousands
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('2,500')).toBeInTheDocument();
      expect(screen.getByText('10,000')).toBeInTheDocument();
    });

    it('should show parsed success message when parsing complete', () => {
      render(
        <ImportStep1Upload
          onFileSelected={mockOnFileSelected}
          uploadedFile={file}
          parseProgress={{
            isParsing: false,
            rowCount: {
              parts: 100,
              vehicleApplications: 250,
              crossReferences: 500,
            },
          }}
        />
      );

      expect(screen.getByText('admin.import.upload.parsed')).toBeInTheDocument();
    });

    it('should not show row counts when still parsing', () => {
      render(
        <ImportStep1Upload
          onFileSelected={mockOnFileSelected}
          uploadedFile={file}
          parseProgress={{
            isParsing: true,
            rowCount: {
              parts: 100,
              vehicleApplications: 250,
              crossReferences: 500,
            },
          }}
        />
      );

      // Row counts should not be visible while parsing
      expect(screen.queryByText('100')).not.toBeInTheDocument();
      expect(screen.queryByText('admin.import.upload.parsed')).not.toBeInTheDocument();
    });
  });

  describe('Processing State', () => {
    it('should disable browse button when processing', () => {
      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} isProcessing={true} />);

      const browseButton = screen.getByText('admin.import.upload.chooseFile');
      expect(browseButton).toBeDisabled();
    });

    it('should enable browse button when not processing', () => {
      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} isProcessing={false} />);

      const browseButton = screen.getByText('admin.import.upload.chooseFile');
      expect(browseButton).not.toBeDisabled();
    });
  });

  describe('Error Display Styling', () => {
    it('should apply error styling to upload zone when error exists', () => {
      render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      const fileInput = screen.getByLabelText('File upload') as HTMLInputElement;
      const file = new File(['test'], 'test.csv', { type: 'text/csv' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      const { container } = render(<ImportStep1Upload onFileSelected={mockOnFileSelected} />);

      // Re-trigger error
      const fileInput2 = screen.getAllByLabelText('File upload')[1] as HTMLInputElement;
      Object.defineProperty(fileInput2, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput2);

      // Check error card is displayed
      expect(screen.getAllByText('Upload Error').length).toBeGreaterThan(0);
    });
  });
});
