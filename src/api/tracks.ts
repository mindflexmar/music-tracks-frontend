
const baseURL = import.meta.env.VITE_API_URL;
fetch(`${baseURL}/api/tracks`)
  .then(res => res.json())
  .then(data => {
    console.log(data);
  })
  .catch(err => {
    console.error('Error while getting tracks', err);
  });
