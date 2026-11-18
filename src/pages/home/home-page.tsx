import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeQuery } from "@/features/auth/auth-api";
import { getErrorMessage } from "@/lib/api-error";

// Example page: one authenticated API call (GET /v1/me).
export function HomePage() {
  const { t, i18n } = useTranslation();
  const { data: me, error, isLoading } = useMeQuery();

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>{t("Your account")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-20" />}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {getErrorMessage(error)}
          </p>
        )}
        {me && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">{t("Name")}</dt>
            <dd>{me.fullName}</dd>
            <dt className="text-muted-foreground">{t("Email")}</dt>
            <dd>{me.email}</dd>
            <dt className="text-muted-foreground">{t("Roles")}</dt>
            <dd>
              {me.roles.map((role) => role.displayName).join(", ") || "-"}
            </dd>
            <dt className="text-muted-foreground">{t("Registered")}</dt>
            {/* API timestamps are UTC; format in the viewer's zone. */}
            <dd>
              {new Date(me.registeredAt).toLocaleString(i18n.language, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </dd>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
