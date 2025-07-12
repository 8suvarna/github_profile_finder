(function () {
  const form = document.getElementById("searchForm");
  const usernameInput = document.getElementById("username");
  const message = document.getElementById("message");
  const loader = document.getElementById("loader");
  const profileCard = document.getElementById("profileCard");
  const avatar = document.getElementById("avatar");
  const nameEl = document.getElementById("name");
  const loginEl = document.getElementById("login");
  const bioEl = document.getElementById("bio");
  const repoCountEl = document.getElementById("repoCount");
  const followersEl = document.getElementById("followers");
  const followingEl = document.getElementById("following");
  const repoList = document.getElementById("repoList");

  function debounce(fn, delay = 600) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }

  async function fetchProfile(user) {
    const controller = new AbortController();
    const signal = controller.signal;

    loader.classList.remove("hidden");
    message.classList.add("hidden");
    profileCard.classList.add("hidden");

    const profileURL = `https://api.github.com/users/${user}`;
    const repoURL = `https://api.github.com/users/${user}/repos?per_page=100&sort=updated`;

    try {
      const [profileRes, repoRes] = await Promise.all([
        fetch(profileURL, { signal }),
        fetch(repoURL, { signal }),
      ]);

      if (profileRes.status === 404) {
        throw new Error("User not found");
      }
      if (!profileRes.ok) {
        throw new Error("Failed to fetch profile");
      }

      const profileData = await profileRes.json();
      const reposData = await repoRes.json();

      renderProfile(profileData, reposData);
    } catch (err) {
      message.textContent = err.message || "Something went wrong";
      message.classList.remove("hidden");
    } finally {
      loader.classList.add("hidden");
    }

    return () => controller.abort();
  }

  function renderProfile(profile, repos) {
    avatar.src = profile.avatar_url;
    avatar.alt = `${profile.login} avatar`;
    nameEl.textContent = profile.name || "No name provided";
    loginEl.textContent = `@${profile.login}`;
    bioEl.textContent = profile.bio || "";

    repoCountEl.textContent = `${profile.public_repos} Repositories`;
    followersEl.textContent = `${profile.followers} Followers`;
    followingEl.textContent = `${profile.following} Following`;

    repos.sort((a, b) => {
      if (b.stargazers_count !== a.stargazers_count) {
        return b.stargazers_count - a.stargazers_count;
      }
      return a.name.localeCompare(b.name);
    });

    repoList.innerHTML = "";

    if (!repos.length) {
      repoList.innerHTML =
        '<li class="text-sm text-gray-400">No public repositories.</li>';
    } else {
      repos.slice(0, 10).forEach((repo) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <a href="${repo.html_url}" target="_blank" rel="noopener"
            class="block rounded-lg border border-[#30363d] p-4 hover:bg-[#0d1117] hover:border-accent transition">
            <h4 class="font-semibold text-accent">${repo.name}</h4>
            <p class="mt-1 text-xs text-gray-400">${repo.description || "No description"}</p>
            <div class="mt-2 flex flex-wrap gap-4 text-[10px] text-gray-400">
              <span>★ ${repo.stargazers_count}</span>
              <span>● ${repo.language || "N/A"}</span>
              <span>Updated: ${new Date(repo.updated_at).toLocaleDateString()}</span>
            </div>
          </a>`;
        repoList.appendChild(li);
      });
    }

    profileCard.classList.remove("hidden");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = usernameInput.value.trim();
    if (user) fetchProfile(user);
  });

  usernameInput.addEventListener(
    "input",
    debounce((e) => {
      const user = e.target.value.trim();
      if (user) {
        fetchProfile(user);
      } else {
        profileCard.classList.add("hidden");
      }
    })
  );
})();
