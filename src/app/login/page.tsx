import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { LoginForm, type LoginState } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { passwordChanged, callbackUrl } = await searchParams;
  const redirectTo = typeof callbackUrl === "string" ? callbackUrl : "/";

  async function authenticate(_prevState: LoginState, formData: FormData): Promise<LoginState> {
    "use server";
    const phone = formData.get("phone");
    try {
      await signIn("credentials", formData);
    } catch (signInError) {
      if (signInError instanceof AuthError) {
        return {
          error: "Celular ou senha inválidos.",
          values: { phone: typeof phone === "string" ? phone : "" },
        };
      }
      throw signInError;
    }
    return {};
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <LoginForm
        action={authenticate}
        redirectTo={redirectTo}
        passwordChangedMessage={Boolean(passwordChanged)}
      />
    </div>
  );
}
