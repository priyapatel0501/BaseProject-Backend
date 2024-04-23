const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

const getChangedColumns = (newData, oldData, columns = [], exclude = []) => {
    var oldValues = {};
    var newValues = {};
    var affectedColumns = [];

    columns.forEach((col) => {
        if (exclude.includes(col)) {
            return;
        }

        let oldValue = null;
        let newValue = null;

        if (Object.prototype.hasOwnProperty.call(oldData, col)) oldValue = oldData[col];

        if (Object.prototype.hasOwnProperty.call(newData, col)) newValue = newData[col];

        if (String(oldValue) !== String(newValue)) {
            if (oldValue) oldValues[col] = oldValue;
            if (newValue) newValues[col] = newValue;

            affectedColumns.push(col);
        }
    });

    return { oldValues, newValues, affectedColumns };
};

const checkDestroyOperation = (operation, columns = []) => {
    if (operation.toLowerCase() === 'destroy') {
        return true;
    }
    if (operation.toLowerCase() === 'bulkdelete') {
        return true;
    } else if (columns.includes('deletedAt') || columns.includes('deletedBy')) {
        return true;
    }
    return false;
};

const omitFromArray = (original, exclude) => {
    return original.filter((item) => !exclude.includes(item));
};

module.exports = {
    capitalizeFirstLetter,
    getChangedColumns,
    checkDestroyOperation,
    omitFromArray,
};
