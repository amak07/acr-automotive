"use client";

import { useState } from "react";
import {
  AcrButton,
  AcrCard,
  AcrCardContent,
  AcrCardHeader,
  AcrInput,
  AcrLabel,
  AcrSelect,
  AcrTextarea,
  AcrAlert,
  AcrSpinner,
  AcrComboBox,
} from "@/components/acr";
import {
  ChevronRight,
  Palette,
  Type,
  Mouse,
  Square,
  FileText,
  Bell,
  Loader,
} from "lucide-react";

const sections = [
  { id: "typography", label: "Typography", icon: Type },
  { id: "colors", label: "Colors", icon: Palette },
  { id: "buttons", label: "Buttons", icon: Mouse },
  { id: "cards", label: "Cards", icon: Square },
  { id: "forms", label: "Forms", icon: FileText },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "loading", label: "Loading", icon: Loader },
];

export default function DesignSystemPage() {
  const [activeSection, setActiveSection] = useState("typography");

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-acr-gray-200 shadow-sm z-10">
        <div className="p-6 border-b border-acr-gray-200">
          <h1 className="acr-heading-4 text-acr-gray-900">ACR Design System</h1>
          <p className="acr-body-small text-acr-gray-600 mt-1">
            Component Library & Style Guide
          </p>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {sections.map((section) => {
              const IconComponent = section.icon;
              return (
                <li key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? "bg-acr-red-50 text-acr-red-700"
                        : "text-acr-gray-700 hover:bg-acr-gray-50"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="acr-body-small">{section.label}</span>
                    {activeSection === section.id && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Typography Section */}
          <section id="typography" className="scroll-mt-8">
            <div className="mb-8">
              <h2 className="acr-heading-2 text-acr-gray-900 mb-2">
                Typography
              </h2>
              <p className="acr-body text-acr-gray-600">
                Coca-Cola inspired typography system with tight letter spacing
                and bold hierarchies.
              </p>
            </div>

            <div className="grid gap-8">
              {/* Headings */}
              <AcrCard variant="default" padding="default">
                <AcrCardHeader>
                  <h3 className="acr-heading-6 text-acr-gray-900">Headings</h3>
                </AcrCardHeader>
                <AcrCardContent>
                  <div className="space-y-4">
                    <div>
                      <h1 className="acr-heading-1 text-acr-gray-900">
                        Heading 1
                      </h1>
                      <code className="acr-caption text-acr-gray-500">
                        acr-heading-1
                      </code>
                    </div>
                    <div>
                      <h2 className="acr-heading-2 text-acr-gray-900">
                        Heading 2
                      </h2>
                      <code className="acr-caption text-acr-gray-500">
                        acr-heading-2
                      </code>
                    </div>
                    <div>
                      <h3 className="acr-heading-3 text-acr-gray-900">
                        Heading 3
                      </h3>
                      <code className="acr-caption text-acr-gray-500">
                        acr-heading-3
                      </code>
                    </div>
                    <div>
                      <h4 className="acr-heading-4 text-acr-gray-900">
                        Heading 4
                      </h4>
                      <code className="acr-caption text-acr-gray-500">
                        acr-heading-4
                      </code>
                    </div>
                    <div>
                      <h5 className="acr-heading-5 text-acr-gray-900">
                        Heading 5
                      </h5>
                      <code className="acr-caption text-acr-gray-500">
                        acr-heading-5
                      </code>
                    </div>
                    <div>
                      <h6 className="acr-heading-6 text-acr-gray-900">
                        Heading 6
                      </h6>
                      <code className="acr-caption text-acr-gray-500">
                        acr-heading-6
                      </code>
                    </div>
                  </div>
                </AcrCardContent>
              </AcrCard>

              {/* Body Text */}
              <AcrCard variant="default" padding="default">
                <AcrCardHeader>
                  <h3 className="acr-heading-6 text-acr-gray-900">Body Text</h3>
                </AcrCardHeader>
                <AcrCardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="acr-body-large text-acr-gray-900">
                        Large body text for important content
                      </p>
                      <code className="acr-caption text-acr-gray-500">
                        acr-body-large
                      </code>
                    </div>
                    <div>
                      <p className="acr-body text-acr-gray-900">
                        Regular body text for standard content
                      </p>
                      <code className="acr-caption text-acr-gray-500">
                        acr-body
                      </code>
                    </div>
                    <div>
                      <p className="acr-body-small text-acr-gray-900">
                        Small body text for secondary information
                      </p>
                      <code className="acr-caption text-acr-gray-500">
                        acr-body-small
                      </code>
                    </div>
                    <div>
                      <p className="acr-caption text-acr-gray-600">
                        Caption text for labels and metadata
                      </p>
                      <code className="acr-caption text-acr-gray-500">
                        acr-caption
                      </code>
                    </div>
                    <div>
                      <p className="acr-action-text text-acr-gray-900">
                        Action text for interactive elements
                      </p>
                      <code className="acr-caption text-acr-gray-500">
                        acr-action-text
                      </code>
                    </div>
                  </div>
                </AcrCardContent>
              </AcrCard>
            </div>
          </section>

          {/* Colors Section */}
          <section id="colors" className="scroll-mt-8">
            <div className="mb-8">
              <h2 className="acr-heading-2 text-acr-gray-900 mb-2">Colors</h2>
              <p className="acr-body text-acr-gray-600">
                Brand colors and utility palette for consistent theming.
              </p>
            </div>

            <div className="grid gap-8">
              {/* Brand Colors */}
              <AcrCard variant="default" padding="default">
                <AcrCardHeader>
                  <h3 className="acr-heading-6 text-acr-gray-900">
                    Brand Colors
                  </h3>
                </AcrCardHeader>
                <AcrCardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="w-full h-20 bg-acr-red-500 rounded-lg mb-2"></div>
                      <p className="acr-body-small text-acr-gray-900">
                        ACR Red
                      </p>
                      <code className="acr-caption text-acr-gray-500">
                        #ed1c24
                      </code>
                    </div>
                    <div className="text-center">
                      <div className="w-full h-20 bg-acr-gray-800 rounded-lg mb-2"></div>
                      <p className="acr-body-small text-acr-gray-900">
                        Dark Gray
                      </p>
                      <code className="acr-caption text-acr-gray-500">
                        #1f2937
                      </code>
                    </div>
                    <div className="text-center">
                      <div className="w-full h-20 bg-acr-gray-100 rounded-lg mb-2"></div>
                      <p className="acr-body-small text-acr-gray-900">
                        Light Gray
                      </p>
                      <code className="acr-caption text-acr-gray-500">
                        #f3f4f6
                      </code>
                    </div>
                  </div>
                </AcrCardContent>
              </AcrCard>
            </div>
          </section>

          {/* Buttons Section */}
          <section id="buttons" className="scroll-mt-8">
            <div className="mb-8">
              <h2 className="acr-heading-2 text-acr-gray-900 mb-2">Buttons</h2>
              <p className="acr-body text-acr-gray-600">
                Interactive buttons with Coca-Cola inspired gradients and modern
                effects.
              </p>
            </div>

            <AcrCard variant="default" padding="default">
              <AcrCardContent>
                <div className="grid gap-8">
                  {/* Variants */}
                  <div>
                    <h4 className="acr-heading-6 text-acr-gray-900 mb-4">
                      Variants
                    </h4>
                    <div className="flex flex-wrap gap-4">
                      <AcrButton variant="primary">Primary</AcrButton>
                      <AcrButton variant="secondary">Secondary</AcrButton>
                      <AcrButton variant="destructive">Destructive</AcrButton>
                      <AcrButton variant="ghost">Ghost</AcrButton>
                      <AcrButton variant="link">Link</AcrButton>
                      <AcrButton variant="success">Success</AcrButton>
                    </div>
                  </div>

                  {/* Sizes */}
                  <div>
                    <h4 className="acr-heading-6 text-acr-gray-900 mb-4">
                      Sizes
                    </h4>
                    <div className="flex items-center gap-4">
                      <AcrButton variant="primary" size="sm">
                        Small
                      </AcrButton>
                      <AcrButton variant="primary" size="default">
                        Default
                      </AcrButton>
                      <AcrButton variant="primary" size="lg">
                        Large
                      </AcrButton>
                    </div>
                  </div>

                  {/* States */}
                  <div>
                    <h4 className="acr-heading-6 text-acr-gray-900 mb-4">
                      States
                    </h4>
                    <div className="flex gap-4">
                      <AcrButton variant="primary">Normal</AcrButton>
                      <AcrButton variant="primary" disabled>
                        Disabled
                      </AcrButton>
                    </div>
                  </div>
                </div>
              </AcrCardContent>
            </AcrCard>
          </section>

          {/* Cards Section */}
          <section id="cards" className="scroll-mt-8">
            <div className="mb-8">
              <h2 className="acr-heading-2 text-acr-gray-900 mb-2">Cards</h2>
              <p className="acr-body text-acr-gray-600">
                Content containers with enhanced shadows and modern styling.
              </p>
            </div>

            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AcrCard variant="default" padding="default">
                  <AcrCardHeader>
                    <h4 className="acr-heading-6 text-acr-gray-900">
                      Default Card
                    </h4>
                  </AcrCardHeader>
                  <AcrCardContent>
                    <p className="acr-body-small text-acr-gray-600">
                      Standard card with subtle shadow and hover effects.
                    </p>
                  </AcrCardContent>
                </AcrCard>

                <AcrCard variant="elevated" padding="default">
                  <AcrCardHeader>
                    <h4 className="acr-heading-6 text-acr-gray-900">
                      Elevated Card
                    </h4>
                  </AcrCardHeader>
                  <AcrCardContent>
                    <p className="acr-body-small text-acr-gray-600">
                      Enhanced shadow for prominent content.
                    </p>
                  </AcrCardContent>
                </AcrCard>

                <AcrCard variant="featured" padding="default">
                  <AcrCardHeader>
                    <h4 className="acr-heading-6 text-acr-gray-900">
                      Featured Card
                    </h4>
                  </AcrCardHeader>
                  <AcrCardContent>
                    <p className="acr-body-small text-acr-gray-600">
                      Subtle ACR red gradient background for featured content.
                    </p>
                  </AcrCardContent>
                </AcrCard>
              </div>
            </div>
          </section>

          {/* Forms Section */}
          <section id="forms" className="scroll-mt-8">
            <div className="mb-8">
              <h2 className="acr-heading-2 text-acr-gray-900 mb-2">
                Form Components
              </h2>
              <p className="acr-body text-acr-gray-600">
                Input fields, labels, and form controls with Coca-Cola inspired
                styling. Clean, substantial feel with bold borders and generous padding.
              </p>
            </div>

            <AcrCard variant="default" padding="default">
              <AcrCardHeader>
                <h3 className="acr-heading-6 text-acr-gray-900">
                  Form Components
                </h3>
                <p className="acr-body-small text-acr-gray-600">
                  Bold styling inspired by Coca-Cola&apos;s design system
                </p>
              </AcrCardHeader>
              <AcrCardContent>
                <div className="grid gap-6 max-w-2xl">
                  <div>
                    <AcrLabel htmlFor="demo-input">Demo Input</AcrLabel>
                    <AcrInput
                      id="demo-input"
                      placeholder="Enter text here..."
                      defaultValue="Sample input value"
                    />
                  </div>

                  <div>
                    <AcrLabel htmlFor="demo-textarea">Demo Textarea</AcrLabel>
                    <AcrTextarea
                      id="demo-textarea"
                      placeholder="Enter notes..."
                      rows={3}
                      defaultValue="Sample text area content"
                    />
                  </div>

                  <div>
                    <AcrLabel htmlFor="demo-input-error">Error State Example</AcrLabel>
                    <AcrInput
                      id="demo-input-error"
                      placeholder="This input has an error..."
                      error="This field is required"
                    />
                  </div>

                  <div>
                    <AcrLabel htmlFor="demo-select">Demo Select</AcrLabel>
                    <AcrSelect.Root defaultValue="option1">
                      <AcrSelect.Trigger>
                        <AcrSelect.Value placeholder="Select an option..." />
                      </AcrSelect.Trigger>
                      <AcrSelect.Content>
                        <AcrSelect.Item value="option1">
                          Option 1
                        </AcrSelect.Item>
                        <AcrSelect.Item value="option2">
                          Option 2
                        </AcrSelect.Item>
                        <AcrSelect.Item value="option3">
                          Option 3
                        </AcrSelect.Item>
                      </AcrSelect.Content>
                    </AcrSelect.Root>
                  </div>

                  <div>
                    <AcrLabel htmlFor="demo-combobox">Demo ComboBox</AcrLabel>
                    <AcrComboBox
                      placeholder="Select or search..."
                      searchPlaceholder="Search options..."
                      options={[
                        { value: "apple", label: "Apple" },
                        { value: "banana", label: "Banana" },
                        { value: "orange", label: "Orange" },
                        { value: "grape", label: "Grape" },
                        { value: "strawberry", label: "Strawberry" },
                      ]}
                      onValueChange={(value) => console.log("Selected:", value)}
                      allowCustomValue
                      onCreateValue={async (value) => {
                        console.log("Creating new value:", value);
                      }}
                    />
                  </div>
                </div>
              </AcrCardContent>
            </AcrCard>
          </section>

          {/* Alerts Section */}
          <section id="alerts" className="scroll-mt-8">
            <div className="mb-8">
              <h2 className="acr-heading-2 text-acr-gray-900 mb-2">Alerts</h2>
              <p className="acr-body text-acr-gray-600">
                Status messages and notifications for user feedback.
              </p>
            </div>

            <div className="space-y-4">
              <AcrAlert
                variant="default"
                title="Default Alert"
                description="This is a default alert message."
              />
              <AcrAlert
                variant="destructive"
                title="Error Alert"
                description="Something went wrong. Please try again."
              />
            </div>
          </section>

          {/* Loading Section */}
          <section id="loading" className="scroll-mt-8">
            <div className="mb-8">
              <h2 className="acr-heading-2 text-acr-gray-900 mb-2">
                Loading States
              </h2>
              <p className="acr-body text-acr-gray-600">
                Spinners and loading indicators for async operations.
              </p>
            </div>

            <AcrCard variant="default" padding="default">
              <AcrCardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="flex flex-col items-center justify-center h-24">
                    <AcrSpinner size="sm" type="icon" />
                    <p className="acr-body-small text-acr-gray-600 mt-2">
                      Small Icon
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center h-24">
                    <AcrSpinner size="md" type="icon" />
                    <p className="acr-body-small text-acr-gray-600 mt-2">
                      Medium Icon
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center h-24">
                    <AcrSpinner size="lg" type="icon" />
                    <p className="acr-body-small text-acr-gray-600 mt-2">
                      Large Icon
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center h-24">
                    <AcrSpinner size="md" type="border" />
                    <p className="acr-body-small text-acr-gray-600 mt-2">
                      Border Spinner
                    </p>
                  </div>
                </div>
              </AcrCardContent>
            </AcrCard>
          </section>
        </div>
      </div>
    </div>
  );
}
