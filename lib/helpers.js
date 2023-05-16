export const getQuery = (data) => {
  let query = '';
  for (const param in data) {
    query = `${query}${query ? '&' : '?'}${param}=${data[param]}`
  }

  return query;
}