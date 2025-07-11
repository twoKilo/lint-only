

const observable = Observable.create((observer) => {

  observer.next("A");

  observer.next("B");

});

const observer = {
  next: (value) => {
    console.log("observable notify us with value", value);
  },
  complete: () => {
    console.log("observable is Done, Completed");
  },
  error: () => {
    console.log("observable on error");
  },
};

observable.subscribe(observer);


observable.subscribe((value) => {
  console.log("observable notify us with value", value);
});







