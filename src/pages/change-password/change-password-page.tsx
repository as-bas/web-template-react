import { Loader2Icon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { FormField } from "@/components/common/form-field";
import { PasswordInput } from "@/components/common/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useChangePasswordMutation } from "@/features/auth/auth-api";
import { getErrorMessage, getFieldErrors } from "@/lib/api-error";

// POST /v1/auth/password: 422s land on their field; other sessions end.
export function ChangePasswordPage() {
  const { t } = useTranslation();
  const [changePassword, { isLoading, error, reset }] =
    useChangePasswordMutation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const fields = getFieldErrors(error);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      setCurrentPassword("");
      setNewPassword("");
      reset();
      toast.success(t("Password changed"));
    } catch {
      // shown below through `error`
    }
  };

  return (
    <Card className="max-w-md">
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-6" noValidate>
          <FormField
            label={t("Current password")}
            htmlFor="current-password"
            error={fields.currentPassword}
          >
            <PasswordInput
              id="current-password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </FormField>
          <FormField
            label={t("New password")}
            htmlFor="new-password"
            error={fields.newPassword}
            hint={t(
              "At least 7 characters, with an uppercase and a lowercase letter, a number and a symbol",
            )}
          >
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </FormField>
          {error && Object.keys(fields).length === 0 && (
            <p role="alert" className="text-sm text-destructive">
              {getErrorMessage(error)}
            </p>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="justify-self-start"
          >
            {isLoading && <Loader2Icon className="animate-spin" />}
            {t("Change password")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
