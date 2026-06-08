// @ts-check

/**
 * The base url must not end with a /. This function asserts that at build-time.
 * @template {string} T
 * @param {T extends `${string}/` ? never : T} value
 * @returns {T}
 */
function defineBaseUrl(value) {
  return value
}

export const baseUrl = defineBaseUrl('/docs')
