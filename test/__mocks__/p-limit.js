module.exports = function pLimit() {
    return (fn) => fn();
};

// Important: pour que `import pLimit from 'p-limit'` marche aussi
module.exports.default = module.exports;
