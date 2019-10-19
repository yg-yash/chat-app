const socket = io();

//server (emit) --> client(recieve) -->acknowledgement --> server
//client (emit) --> server(recieve) -->acknowledgement --> client

//elements
const form = document.querySelector("#message-form");
const sendBtn = document.querySelector("#sendBtn");
const input = document.querySelector("#messageText");
const locationBtn = document.querySelector("#locationBtn");
const messages = document.querySelector("#messages");
//template
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const autoscroll = () => {
  //new message element
  const newMessage = messages.lastElementChild;

  //height of the new message
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  const visibleHeight = messages.offsetHeight;

  //height of messages cotainer
  const containerHeight = messages.scrollHeight;

  // how far have i scrolled
  const scrollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on("message", msg => {
  const html = Mustache.render(messageTemplate, {
    username: msg.username,
    message: msg.text,
    createdAt: moment(msg.createdAt).format("hh:mm a")
  });

  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", url => {
  const html = Mustache.render(locationTemplate, {
    username: url.username,
    url: url.url,
    createdAt: moment(url.createdAt).format("hh:mm a")
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});
socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  document.querySelector("#sidebar").innerHTML = html;
});

form.addEventListener("submit", e => {
  e.preventDefault();
  sendBtn.setAttribute("disabled", "disabled");

  const message = input.value;
  socket.emit("sendMessage", message, error => {
    sendBtn.removeAttribute("disabled");
    input.value = "";
    input.focus();
    if (error) {
      return console.log(error);
    }

    console.log("The message was delievered");
  });
});

locationBtn.addEventListener("click", e => {
  if (!navigator.geolocation) {
    return alert("geolocation not available");
  }
  locationBtn.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition(position => {
    const sharedLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
    socket.emit("sendLocation", sharedLocation, () => {
      locationBtn.removeAttribute("disabled");
      console.log("Location Shared");
    });
  });
});

socket.emit("join", { username, room }, error => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
