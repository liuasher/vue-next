exports.assert = function assert(condition, msg) {
  if (!condition) {
    throw new Error(msg || `unexpected compiler condition`)
  }
}

exports.advancePositionWithMutation = function advancePositionWithMutation(
  pos,
  source,
  numberOfCharacters
) {
  let linesCount = 0
  let lastNewLinePos = -1
  for (let i = 0; i < numberOfCharacters; i++) {
    if (source.charCodeAt(i) === 10 /* newline char code */) {
      linesCount++
      lastNewLinePos = i
    }
  }

  pos.offset += numberOfCharacters
  pos.line += linesCount
  pos.column =
    lastNewLinePos === -1
      ? pos.column + numberOfCharacters
      : Math.max(1, numberOfCharacters - lastNewLinePos)

  return pos
}

exports.advancePositionWithClone = function advancePositionWithClone(
  pos,
  source,
  numberOfCharacters = source.length
) {
  return advancePositionWithMutation({ ...pos }, source, numberOfCharacters)
}


function advancePositionWithMutation(
  pos,
  source,
  numberOfCharacters = source.length
) {
  let linesCount = 0
  let lastNewLinePos = -1
  for (let i = 0; i < numberOfCharacters; i++) {
    if (source.charCodeAt(i) === 10 /* newline char code */) {
      linesCount++
      lastNewLinePos = i
    }
  }

  pos.offset += numberOfCharacters
  pos.line += linesCount
  pos.column =
    lastNewLinePos === -1
      ? pos.column + numberOfCharacters
      : Math.max(1, numberOfCharacters - lastNewLinePos)

  return pos
}
exports.advancePositionWithMutation = advancePositionWithMutation