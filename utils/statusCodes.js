const string = require('../server/helpers/language-helper');

const statusCode = {
    success: 1,
    emptyData: { code: 400, message: string.statusResponses.emptyData },
    unAuthorized: { code: 401, message: string.statusResponses.unAuthorized },
    successData: { code: 200, message: string.statusResponses.success },
    createdData: { code: 201, message: string.statusResponses.created },
    notFound: { code: 404, message: string.statusResponses.notFound },
    serverError: { code: 500, message: string.statusResponses.serverError },
}

module.exports = statusCode;
