"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { AcrButton } from "@/components/acr";
import { useToast } from "@/hooks/common/use-toast";
import { useLocale } from "@/contexts/LocaleContext";
import { contactInfoSchema, type ContactInfoParams } from "@/lib/schemas/admin";
import type { ContactInfo } from "@/types/domain/settings";

type ContactInfoFormData = ContactInfoParams;

export function ContactInfoSettings() {
  const { toast } = useToast();
  const { t } = useLocale();
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "contact_info"],
    queryFn: async () => {
      const response = await fetch("/api/admin/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      return (data.settings?.contact_info as ContactInfo) ?? null;
    },
  });

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ContactInfoFormData>({
    resolver: zodResolver(contactInfoSchema),
    values: settings, // Auto-populate when data loads
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ContactInfoFormData) => {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "contact_info",
          value: data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update settings");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate both admin and public settings queries
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["public", "settings"] });
      reset(data.setting.value); // Reset form with saved values
      toast({
        variant: "success",
        title: t("admin.settings.contactInfo.updated"),
        description: t("admin.settings.contactInfo.success"),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("admin.settings.contactInfo.error"),
        description: error.message,
      });
    },
  });

  const onSubmit = (data: ContactInfoFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-acr-red-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-acr-gray-300 shadow-md p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-acr-gray-900 mb-2">
            {t("admin.settings.contactInfo.email")}
          </label>
          <input
            type="email"
            {...register("email")}
            className="w-full px-4 py-3 border-2 border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            placeholder={t("admin.settings.contactInfo.emailPlaceholder")}
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-acr-gray-900 mb-2">
            {t("admin.settings.contactInfo.phone")}
          </label>
          <input
            type="tel"
            {...register("phone")}
            className="w-full px-4 py-3 border-2 border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            placeholder={t("admin.settings.contactInfo.phonePlaceholder")}
          />
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-semibold text-acr-gray-900 mb-2">
            {t("admin.settings.contactInfo.whatsapp")}
          </label>
          <input
            type="tel"
            {...register("whatsapp")}
            className="w-full px-4 py-3 border-2 border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            placeholder={t("admin.settings.contactInfo.whatsappPlaceholder")}
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-semibold text-acr-gray-900 mb-2">
            {t("admin.settings.contactInfo.address")}
          </label>
          <textarea
            {...register("address")}
            rows={3}
            className="w-full px-4 py-3 border-2 border-acr-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            placeholder={t("admin.settings.contactInfo.addressPlaceholder")}
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-acr-gray-200">
          <AcrButton
            type="submit"
            disabled={!isDirty || updateMutation.isPending}
            className="min-w-[120px]"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("admin.settings.actions.saving")}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t("admin.settings.actions.save")}
              </>
            )}
          </AcrButton>
        </div>
      </form>
    </div>
  );
}
