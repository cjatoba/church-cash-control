import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { changePassword } from "@/server/application/change-password";
import { hashPassword } from "@/server/infrastructure/auth/password";
import { createDbClient } from "@/server/infrastructure/db/client";
import { createUserPasswordRepository } from "@/server/infrastructure/db/user-password-repository";

export default async function ChangePasswordPage({ searchParams }: PageProps<"/change-password">) {
  const { error } = await searchParams;
  const session = await auth();
  const userId = session?.user.id;

  async function submit(formData: FormData): Promise<void> {
    "use server";

    if (!userId) {
      redirect("/login");
    }

    const input = {
      newPassword: formData.get("newPassword"),
      confirmNewPassword: formData.get("confirmNewPassword"),
    };

    try {
      const db = createDbClient();
      const repository = createUserPasswordRepository(db);
      await changePassword(repository, hashPassword, userId, input);
    } catch {
      redirect("/change-password?error=1");
    }

    await signOut({ redirectTo: "/login?passwordChanged=1" });
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <form
        action={submit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950"
      >
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Alterar senha</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Este é seu primeiro acesso. Defina uma nova senha para continuar.
        </p>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            Não foi possível alterar a senha. Confira se as senhas digitadas coincidem e têm pelo
            menos 8 caracteres.
          </p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Nova senha
          <input
            name="newPassword"
            type="password"
            required
            minLength={8}
            className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Confirmar nova senha
          <input
            name="confirmNewPassword"
            type="password"
            required
            minLength={8}
            className="rounded border border-black/[.08] px-3 py-2 dark:border-white/[.145] dark:bg-black"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-foreground px-5 py-2 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Salvar nova senha
        </button>
      </form>
    </div>
  );
}
