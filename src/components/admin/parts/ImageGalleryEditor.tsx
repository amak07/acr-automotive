"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tables } from "@/lib/supabase/types";
import { useLocale } from "@/contexts/LocaleContext";
import type { TranslationKeys } from "@/lib/i18n/translation-keys";

type PartImage = Tables<"part_images">;

interface ImageGalleryEditorProps {
  images: PartImage[];
  onReorder: (imageIds: string[]) => void;
  onSetPrimary: (imageId: string) => void;
  onDelete: (imageId: string) => void;
  onUpdateCaption?: (imageId: string, caption: string) => void; // Optional now
  isDeleting?: boolean;
}

export function ImageGalleryEditor({
  images,
  onReorder,
  onSetPrimary,
  onDelete,
  onUpdateCaption,
  isDeleting = false,
}: ImageGalleryEditorProps) {
  const [items, setItems] = useState(images);
  const { t } = useLocale();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update items when images prop changes
  useEffect(() => {
    setItems(images);
  }, [images]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Call API to persist order
        onReorder(newOrder.map((i) => i.id));

        return newOrder;
      });
    }
  };

  return (
    <div>
      {/* Instructions */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>{t("partDetails.images.dragTipLabel")}</strong> {t("partDetails.images.dragTip")}
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((image, index) => (
              <SortableImageCard
                key={image.id}
                image={image}
                isPrimary={index === 0}
                onDelete={() => onDelete(image.id)}
                isDeleting={isDeleting}
                t={t}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

interface SortableImageCardProps {
  image: PartImage;
  isPrimary: boolean;
  onDelete: () => void;
  isDeleting: boolean;
  t: (key: keyof TranslationKeys) => string;
}

function SortableImageCard({
  image,
  isPrimary,
  onDelete,
  isDeleting,
  t,
}: SortableImageCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="overflow-hidden"
    >
      <CardContent className="p-0">
        {/* Image Preview */}
        <div className="relative aspect-square bg-acr-gray-100">
          {/* Draggable area (image only) */}
          <div
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <img
              src={image.image_url}
              alt="Part image"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Dark overlay at top for better button visibility */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

          {/* Primary Badge - Red background */}
          {isPrimary && (
            <Badge
              className="absolute top-2 left-2 bg-red-600 text-white border-0 pointer-events-none"
              variant="default"
            >
              {t("partDetails.images.primary")}
            </Badge>
          )}

          {/* Actions */}
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            {/* Delete */}
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("[ImageGalleryEditor] Delete button clicked");
                if (confirm(t("partDetails.images.deleteConfirm"))) {
                  console.log("[ImageGalleryEditor] User confirmed delete, calling onDelete");
                  onDelete();
                } else {
                  console.log("[ImageGalleryEditor] User cancelled delete");
                }
              }}
              disabled={isDeleting}
              title={t("partDetails.images.deleteTooltip")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}