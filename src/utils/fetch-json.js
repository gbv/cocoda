export default async function fetchJson(resource, options) {
  const response = await fetch(resource, options)
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  return response.json()
}
