// app/yandex/actions.ts
"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

async function getAuthToken() {
  const session = await auth()
  // Если токена нет в NextAuth, файлы не загрузятся
  if (!session?.accessToken) {
    throw new Error("Не авторизован в Яндекс.Диске")
  }
  return session.accessToken
}

// 1. Получение статистики Диска
export async function getDiskDiskInfo() {
  try {
    const token = await getAuthToken()
    const res = await fetch("https://cloud-api.yandex.net/v1/disk", {
      headers: { Authorization: `OAuth ${token}` },
    })
    if (!res.ok) throw new Error("Ошибка получения инфо о диске")
    return await res.json()
  } catch (error) {
    console.error("Ошибка getDiskDiskInfo:", error)
    return null
  }
}

// 2. Получение содержимого текущей папки
export async function getFolderContents(path: string = "/") {
  try {
    const token = await getAuthToken()
    const encodedPath = encodeURIComponent(path)
    const res = await fetch(`https://cloud-api.yandex.net/v1/disk/resources?path=${encodedPath}&limit=100`, {
      headers: { Authorization: `OAuth ${token}` },
    })
    if (!res.ok) throw new Error("Ошибка получения содержимого папки")
    const data = await res.json()
    return data._embedded?.items || []
  } catch (error) {
    console.error("Ошибка getFolderContents:", error)
    return []
  }
}

// 3. Загрузка файла в текущую папку
export async function uploadFileToDisk(formData: FormData) {
  try {
    const token = await getAuthToken()
    const file = formData.get("file") as File
    const currentPath = formData.get("currentPath") as string || "/"
    
    if (!file || file.size === 0) return { error: "Файл не выбран" }

    const targetPath = currentPath === "/" ? `/${file.name}` : `${currentPath}/${file.name}`
    const encodedPath = encodeURIComponent(targetPath)
    
    const getUploadUrlRes = await fetch(
      `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodedPath}&overwrite=true`,
      { headers: { Authorization: `OAuth ${token}` } }
    )

    if (!getUploadUrlRes.ok) {
      const errData = await getUploadUrlRes.json()
      return { error: errData.message || "Не удалось получить URL" }
    }
    
    const { href: uploadUrl } = await getUploadUrlRes.json()

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file
    })

    if (!uploadRes.ok) throw new Error("Ошибка при передаче файла")

    revalidatePath("/files")
    return { success: true }
  } catch (error: any) {
    console.error("Ошибка uploadFileToDisk:", error)
    return { error: error.message || "Что-то пошло не так" }
  }
}

// 4. Удаление файла или папки
export async function deleteResource(path: string) {
  try {
    const token = await getAuthToken()
    const encodedPath = encodeURIComponent(path)
    
    const res = await fetch(`https://cloud-api.yandex.net/v1/disk/resources?path=${encodedPath}&permanently=false`, {
      method: "DELETE",
      headers: { Authorization: `OAuth ${token}` },
    })

    if (!res.ok) throw new Error("Не удалось удалить объект")
    
    revalidatePath("/files")
    return { success: true }
  } catch (error: any) {
    console.error("Ошибка deleteResource:", error)
    return { error: error.message || "Ошибка при удалении" }
  }
}

// 5. Создание временной публичной ссылки на скачивание
export async function getDownloadLink(path: string) {
  try {
    const token = await getAuthToken()
    const encodedPath = encodeURIComponent(path)
    
    const res = await fetch(`https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodedPath}`, {
      headers: { Authorization: `OAuth ${token}` },
    })

    if (!res.ok) throw new Error("Не удалось получить ссылку")
    const data = await res.json()
    return { href: data.href }
  } catch (error: any) {
    console.error("Ошибка getDownloadLink:", error)
    return { error: error.message || "Ошибка получения ссылки" }
  }
}
// 6. Публикация ресурса (получение публичной ссылки)
export async function publishResource(path: string) {
  try {
    const token = await getAuthToken()
    const encodedPath = encodeURIComponent(path)

    // Шаг 1: Публикуем ресурс
    const publishRes = await fetch(
      `https://cloud-api.yandex.net/v1/disk/resources/publish?path=${encodedPath}`,
      {
        method: "PUT",
        headers: { Authorization: `OAuth ${token}` },
      }
    )

    if (!publishRes.ok) throw new Error("Не удалось опубликовать ресурс")

    // Шаг 2: Получаем информацию о ресурсе, чтобы забрать public_url
    const infoRes = await fetch(
      `https://cloud-api.yandex.net/v1/disk/resources?path=${encodedPath}&fields=public_url`,
      {
        headers: { Authorization: `OAuth ${token}` },
      }
    )

    if (!infoRes.ok) throw new Error("Не удалось получить публичную ссылку")
    
    const data = await infoRes.json()
    
    revalidatePath("/files")
    return { publicUrl: data.public_url }
  } catch (error: any) {
    console.error("Ошибка publishResource:", error)
    return { error: error.message || "Ошибка при публикации" }
  }
}