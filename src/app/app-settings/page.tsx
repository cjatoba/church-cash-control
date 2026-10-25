import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { updateAppBranding } from "@/server/application/app-branding";
import { createAppSettingsRepository } from "@/server/infrastructure/db/app-settings-repository";
import { createDbClient } from "@/server/infrastructure/db/client";
import { appIconColors, appIcons, type AppBranding } from "@/server/domain/app-branding";
import { PageShell } from "@/app/_components/page-shell";
import { PageHeader } from "@/app/_components/page-header";
import { APP_BRANDING_CACHE_TAG, getCachedAppBranding } from "@/app/_lib/app-branding";
import { toFriendlyErrorMessage } from "@/app/_lib/action-error-message";
import { logActivity } from "@/app/_lib/log-activity";
import { AppBrandingForm, type AppBrandingFormState } from "./app-branding-form";

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function toSubmittedValues(formData: FormData, fallback: AppBranding): AppBranding {
  const icon = appIcons.find((option) => option === formData.get("icon"));
  const color = appIconColors.find((option) => option === formData.get("color"));
  return {
    name: toStringValue(formData.get("name")),
    shortName: toStringValue(formData.get("shortName")),
    icon: icon ?? fallback.icon,
    color: color ?? fallback.color,
  };
}

export default async function AppSettingsPage() {
  const session = await auth();
  if (!session?.user.canManageUsers) {
    redirect("/");
  }

  const current = await getCachedAppBranding();

  async function save(
    _prevState: AppBrandingFormState,
    formData: FormData,
  ): Promise<AppBrandingFormState> {
    "use server";

    const actionSession = await auth();
    if (!actionSession?.user.canManageUsers) {
      redirect("/");
    }

    const values = toSubmittedValues(formData, current);
    try {
      const db = createDbClient();
      await updateAppBranding(createAppSettingsRepository(db), values);
      await logActivity(db, {
        actorUserId: actionSession.user.id,
        action: "app_branding_updated",
        subjectName: values.name,
      });
    } catch (error) {
      return {
        error: toFriendlyErrorMessage(
          error,
          "Não foi possível salvar. Confira o nome (até 40 letras) e o nome curto (até 12 letras).",
        ),
        values,
      };
    }

    revalidateTag(APP_BRANDING_CACHE_TAG, { expire: 0 });
    return { saved: true, values };
  }

  return (
    <PageShell>
      <PageHeader backHref="/" backLabel="Voltar para o início" title="Personalizar app" />
      <AppBrandingForm current={current} action={save} />
    </PageShell>
  );
}
