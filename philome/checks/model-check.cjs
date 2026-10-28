const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const project = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(project, 'index.html'), 'utf8');
const script = html.split('<script>')[1].split('</script>')[0];
const data = script.slice(0, script.indexOf('const scaleLabels='));
const scoring = script.slice(script.indexOf('function scores()'), script.indexOf('function description('));
const context = vm.createContext({});
vm.runInContext(data + '\nconst answers=Array(questions.length).fill(3);\n' + scoring, context);
const state = vm.runInContext('({dimensions,questions,philosophers,answers,scores})', context);
const { dimensions, questions, philosophers, answers, scores } = state;

assert.equal(dimensions.length, 8);
assert.equal(questions.length, 64);
assert.equal(philosophers.length, 20);
assert.equal(new Set(philosophers.map(person => person.name)).size, philosophers.length);
dimensions.forEach((dimension, index) => {
  const group = questions.filter(question => question.d === index);
  assert.equal(group.length, 8, dimension.name);
  assert.equal(group.filter(question => question.p === 1).length, 4, dimension.name);
  assert.equal(group.filter(question => question.p === -1).length, 4, dimension.name);
});
philosophers.forEach(person => {
  assert.equal(person.v.length, 8, person.name);
  assert(person.v.every(value => Number.isFinite(value) && value >= -1 && value <= 1), person.name);
  assert(fs.existsSync(path.join(project, 'portraits', person.image)), person.image);
});

const vector = () => Array.from(scores().vector);
answers.fill(3);
assert.deepEqual(vector(), Array(8).fill(0), 'Neutral choices must stay at the midpoint');
answers.fill(0);
assert.deepEqual(vector(), Array(8).fill(0), 'Balanced directions must cancel uniform agreement');
questions.forEach((question, index) => { answers[index] = question.p === 1 ? 0 : 6; });
assert.deepEqual(vector(), Array(8).fill(1), 'All right-pole choices must reach +1');
questions.forEach((question, index) => { answers[index] = question.p === 1 ? 6 : 0; });
assert.deepEqual(vector(), Array(8).fill(-1), 'All left-pole choices must reach -1');
answers.fill(3);
answers[0] = 2;
vector().forEach((value, index) => {
  assert.equal(value, index === questions[0].d ? questions[0].p / 24 : 0);
});

// A profile must be reachable through valid answers, not shadowed by a duplicate.
// This checks the mapping arithmetic; it is not evidence of psychological validity.
const reachable = philosophers.map(person => {
  dimensions.forEach((_, dimension) => {
    const indices = questions.map((question, index) => question.d === dimension ? index : -1).filter(index => index >= 0);
    const target = Math.round(person.v[dimension] * 24);
    const base = Math.trunc(target / 8);
    const remainder = target - base * 8;
    indices.forEach((index, offset) => {
      const contribution = base + (offset < Math.abs(remainder) ? Math.sign(remainder) : 0);
      answers[index] = 3 - contribution * questions[index].p;
      assert(Number.isInteger(answers[index]) && answers[index] >= 0 && answers[index] <= 6);
    });
  });
  assert.equal(scores().ranked[0].name, person.name, person.name + ' must be reachable');
  return person.name;
});
const pairs = [];
philosophers.forEach((first, index) => philosophers.slice(index + 1).forEach(second => {
  pairs.push({ first: first.name, second: second.name, distance: Math.hypot(...first.v.map((value, axis) => value - second.v[axis])) });
}));
pairs.sort((a, b) => a.distance - b.distance);
console.log(JSON.stringify({ questions: questions.length, dimensions: dimensions.length, thinkers: philosophers.length, reachable: reachable.length, balancedDirections: true, endpointsAndMidpoint: true, closestPairs: pairs.slice(0, 5) }, null, 2));
