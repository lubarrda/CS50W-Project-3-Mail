document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Send email
  document.querySelector("#compose-form").addEventListener('submit', send_email);
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#emails-link-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function link_email(id, current_view) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    // Print email
    console.log(email);

    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#emails-link-view').style.display = 'block';

    document.querySelector('#emails-link-view').innerHTML = `
    <ul class="list-group">
      <li class="list-group-item"><strong>From:</strong> ${email.sender}</li>
      <li class="list-group-item"><strong>To:</strong> ${email.recipients}</li>
      <li class="list-group-item"><strong>Subject:</strong> ${email.subject}</li>
      <li class="list-group-item"><strong>Timestamp:</strong> ${email.timestamp}</li>
      <li class="list-group-item">${email.body}</li>
    </ul>
    `

    // Email read
    if (!email.read) {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      })
    }

    if (current_view !== 'sent') {
      // Archive vs Unarchive
      const btn_arcv = document.createElement('button');
      btn_arcv.innerHTML = email.archived ? "Unarchive" : "Archive";
      btn_arcv.className = email.archived ? "btn btn-secondary" : "btn btn-warning";
      btn_arcv.addEventListener('click', function() {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: !email.archived
          })
        })
        .then(() => { load_mailbox('inbox') })      
      });
      document.querySelector('#emails-link-view').append(btn_arcv);
    }

    // Reply
    const btn_reply = document.createElement('button');
    btn_reply.innerHTML = "Reply";
    btn_reply.className = "btn btn-info";
    btn_reply.addEventListener('click', function() {
      compose_email();

      document.querySelector('#compose-recipients').value = email.sender;
      let subject = email.subject;
      if (subject.split(' ', 1)[0] != "Re:") {
        subject = "Re: " + email.subject;
      }
      document.querySelector('#compose-subject').value = subject;
      document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
    });
    document.querySelector('#emails-link-view').append(btn_reply);
  });
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-link-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // pulling emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print emails
    emails.forEach(sentEmail => {
      console.log(sentEmail);

      const newEmail = document.createElement('div');
      newEmail.className = "list-group-item";
      newEmail.innerHTML = `
        <h2> Sender: ${sentEmail.sender} </h2>
        <h4> Subject: ${sentEmail.subject} </h4>
        <h3>  ${sentEmail.timestamp} </h3>
      `;

      newEmail.className = sentEmail.read ? 'read' : 'unread';
      newEmail.addEventListener('click', function() {
        link_email(sentEmail.id, mailbox)
      });
      document.querySelector('#emails-view').append(newEmail);
    });
  });
}

function send_email(event) {
  event.preventDefault();

  // pulling data
  const recipientes = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // pushing data > BE from CS50
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipientes,
      subject: subject,
      body: body,
    })
  })
  .then(response => response.json())
  .then(result => {
    // Print result
    console.log(result);
    load_mailbox('sent');
  });
}
