// Lightweight mock for next/image
const NextImage = ({ src, alt, ...props }) => {
  // eslint-disable-next-line @next/next/no-img-element
  return React.createElement('img', { src, alt, ...props });
};

module.exports = NextImage;
module.exports.default = NextImage;