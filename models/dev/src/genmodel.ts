import builder from '.'

void builder.then((txes) => {
  console.log(JSON.stringify(txes))
})
