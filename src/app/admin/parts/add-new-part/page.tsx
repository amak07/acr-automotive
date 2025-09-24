"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { useToast } from "@/hooks";
import { withAdminAuth } from "@/components/admin/auth/withAdminAuth";
import {
  PartFormContainer,
  PartFormData,
} from "@/components/admin/parts/PartFormContainer";
import { useCreatePart } from "@/hooks/admin/useCreatePart";
import { useRouter } from "next/navigation";

function PartCreatePage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const router = useRouter();
  const createMutation = useCreatePart();

  const onSubmit = async (data: PartFormData) => {
    try {
      // Validation: Ensure SKU number is provided
      if (!data.sku_number?.trim()) {
        toast({
          title: t("common.error.title"),
          description: "SKU number is required",
          variant: "destructive",
        });
        return;
      }

      // Create the part with proper typing
      const createData = {
        ...data,
        sku_number: data.sku_number!, // We've already validated it exists above
      };
      const result = await createMutation.mutateAsync(createData);

      // Show success message
      toast({
        title: t("common.success"),
        description: "Part created successfully",
        variant: "success" as any,
      });

      // Redirect to the newly created part's edit page
      if (result && result.length > 0) {
        router.push(`/admin/parts/${result[0].id}`);
      } else {
        // Fallback to parts list
        router.push("/admin/parts" as any);
      }
    } catch (error) {
      console.error("Create part error:", error);
      toast({
        title: t("common.error.title"),
        description: t("partDetails.actions.saveError"),
        variant: "destructive",
      });
    }
  };

  return (
    <PartFormContainer
      mode="create"
      onSubmit={onSubmit}
      isSubmitting={createMutation.isPending}
    />
  );
}

// Export the wrapped component with admin authentication
export default withAdminAuth(PartCreatePage);
