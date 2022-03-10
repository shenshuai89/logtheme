const {logtheme} = require('../src/index');

test('log success', () => {
  expect(logtheme('success', 'a', 'b', 'c')).toBe(undefined);
});