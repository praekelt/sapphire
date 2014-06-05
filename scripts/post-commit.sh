branch=`git symbolic-ref --short HEAD`

if [ $branch == "develop" ]; then
  gulp build
  git update-index --no-assume-unchanged ./build/*
  git add ./build
  git commit -m "Build"
  git update-index --assume-unchanged ./build/*
fi
