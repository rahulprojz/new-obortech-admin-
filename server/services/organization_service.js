createSubDomain = async (organization) => {
  const
   { 
    GODADDY_BASE_URL, 
    SUB_DOMAIN_NAME, 
    GODADDY_DOMAIN,
    GODADDY_AUTHENTICATION 
    } = process.env
  const unique_id = organization.unique_id
  const domain_name = `${unique_id}-${SUB_DOMAIN_NAME}`
  const url = `${GODADDY_BASE_URL}/v1/domains/${GODADDY_DOMAIN}/records/A/${domain_name}`
  let headers = {
    'Authorization': GODADDY_AUTHENTICATION
  }
  const response = await fetch(url, Object.assign({ method: 'PUT' }, { headers }),).then((res) => res.json())
  return response
}

module.exports = { createSubDomain }

