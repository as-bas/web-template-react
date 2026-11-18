import { Loader2Icon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormField } from "@/components/common/form-field";
import { PasswordInput } from "@/components/common/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLoginMutation } from "@/features/auth/auth-api";
import { getErrorMessage, getFieldErrors } from "@/lib/api-error";

// On success the session lands in the store and GuestOnly redirects.
export function LoginForm() {
  const { t } = useTranslation();
  const [login, { isLoading, error }] = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const fields = getFieldErrors(error);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void login({ email, password });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-6" noValidate>
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">{t("Log in")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("Enter your email and password")}
        </p>
      </div>
      <FormField label={t("Email")} htmlFor="email" error={fields.email}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </FormField>
      <FormField
        label={t("Password")}
        htmlFor="password"
        error={fields.password}
      >
        <PasswordInput
          id="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </FormField>
      {error && Object.keys(fields).length === 0 && (
        <p role="alert" className="text-sm text-destructive">
          {getErrorMessage(error)}
        </p>
      )}
      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2Icon className="animate-spin" />}
        {t("Log in")}
      </Button>
    </form>
  );
}
