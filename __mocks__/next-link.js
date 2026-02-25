// Lightweight mock for next/link
const React = require('react');
const NextLink = ({ children, href, ...props }) => {
  return React.createElement('a', { href, ...props }, children);
};

module.exports = NextLink;
module.exports.default = NextLink;