const Enum = require('enum');

module.exports = {
    Status: new Enum({
        Active: '1',
        Inactive: '0',
    }),
};
