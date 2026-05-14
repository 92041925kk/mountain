function getCurrentUser(auth, onAuthStateChanged) {
  if (auth.currentUser) return Promise.resolve(auth.currentUser)

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe()
        resolve(user)
      },
      (err) => {
        unsubscribe()
        reject(err)
      }
    )
  })
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.meta.requiresAuth || !import.meta.client) return

  const [{ onAuthStateChanged }, { auth }] = await Promise.all([
    import('firebase/auth'),
    import('~/firebase'),
  ])

  const user = await getCurrentUser(auth, onAuthStateChanged)
  if (user) return

  return navigateTo({
    path: '/cymc-admin',
    query: { redirect: to.fullPath },
  })
})
