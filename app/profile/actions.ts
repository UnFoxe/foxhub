"use server"

import { signIn, signOut, auth } from "@/auth"

export async function getYandexSession() {
  return await auth()
}

// Передаем email или ID пользователя Supabase в качестве параметра состояния (state) или подсказки
export async function loginWithYandex(supabaseUserEmail: string) {
  await signIn("yandex", { 
    redirectTo: "/profile",
    // Передаем email, чтобы Яндекс понимал контекст, а мы могли использовать его в коллбэках
    authorizationParams: {
      login_hint: supabaseUserEmail
    }
  })
}

export async function logoutFromYandex() {
  await signOut({ redirectTo: "/profile" })
}