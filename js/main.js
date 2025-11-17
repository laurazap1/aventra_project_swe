document.getElementById('addUserForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;

    // Simple AJAX call to Python script (later can be Flask API)
    fetch(`http://127.0.0.1:5000/add_user?username=${username}&email=${email}`)
        .then(response => response.text())
        .then(data => {
            alert('User added!');
            console.log(data);
        });
});

document.getElementById('loadUsersBtn').addEventListener('click', function() {
    fetch('http://127.0.0.1:5000/users')
        .then(response => response.json())
        .then(users => {
            let html = '<table border="1"><tr><th>ID</th><th>Username</th><th>Email</th></tr>';
            users.forEach(user => {
                html += `<tr><td>${user.user_id}</td><td>${user.username}</td><td>${user.email}</td></tr>`;
            });
            html += '</table>';
            document.getElementById('usersTable').innerHTML = html;
        });
});
