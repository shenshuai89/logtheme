const {log} = require('../src/index');

test('log success', () => {
  expect(log('success', 'a', 'b', 'c')).toBe(undefined);
});