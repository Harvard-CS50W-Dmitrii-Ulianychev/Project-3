// Declare views elements & compose form elements
let emailsView, emailView, composeView, recipientsField, subjectField, bodyField;

document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Define views elements
  emailsView = document.querySelector('#emails-view');
  emailView = document.querySelector('#email-view');
  composeView = document.querySelector('#compose-view');

  // Define compose form elements
  recipientsField = document.querySelector('#compose-recipients');
  subjectField = document.querySelector('#compose-subject');
  bodyField = document.querySelector('#compose-body');

  // By default, load the inbox
  load_mailbox('inbox');

  // Handling click on email on the list
  emailsView.addEventListener('click', event => {
    // Check if clicked element is an email
    const clickedElement = event.target.closest('.email');
    // If email was clicked, handle it
    if (clickedElement) {
      const emailId = clickedElement.dataset.emailId;
      openEmail(emailId);
      // Display individual email view
      emailView.style.display = 'block';
      emailsView.style.display = 'none';
      composeView.style.display = 'none';
    }
  });

  document.querySelector('#compose-form').addEventListener('submit', event => {

    // Prevent default form submission behavior
    event.preventDefault();

    // Get the values from the composition fields
    const recipients = recipientsField.value;
    const subject = subjectField.value;
    const body = bodyField.value;
  
    // Send the email data to the server
    fetch('/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
      load_mailbox('sent');
    })
    .catch(error => {
      console.error('Error:', error);
    })
  });

});

function compose_email(email) {

  // Show compose view and hide other views
  composeView.style.display = 'block';
  emailsView.style.display = 'none';
  emailView.style.display = 'none';

  // Check if message is a reply; get composition fields values
  if (email) {
    recipientsField.value = email.sender || '';
    if (email.subject && !email.subject.startsWith('Re: ')) {
      subjectField.value = `Re: ${email.subject}`;
    } else {
      subjectField.value = email.subject || '';
    }
    bodyField.value = email.timestamp ? `\n\nOn ${email.timestamp} ${email.sender} wrote:\n\n${email.body}` : '';
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  emailsView.style.display = 'block';
  emailView.style.display = 'none';
  composeView.style.display = 'none';

  // Show the mailbox name
  emailsView.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`/emails/${mailbox}`)
  .then(response => response.json()
  .then(emails => {
    emails.forEach(email => {
      displayEmail(email);
    })
  }))
}

function displayEmail(email) {

  // Create email representation
  const emailDiv = document.createElement('div');
  emailDiv.className = 'email';

  // Set the data-email-id attribute to store the email ID
  emailDiv.dataset.emailId = email.id;

  if (email.read) {
    emailDiv.style.opacity = '70%';
  }

  const leftDiv = document.createElement('div'); // Div serves to group sender and subject close to each other on the left
  leftDiv.className = 'left';
  const senderDiv = document.createElement('div');
  senderDiv.className = 'sender';
  senderDiv.textContent = email.sender;
  const subjectDiv = document.createElement('div');
  subjectDiv.textContent = email.subject;
  leftDiv.appendChild(senderDiv);
  leftDiv.appendChild(subjectDiv);
  const timestampDiv = document.createElement('div');
  timestampDiv.textContent = email.timestamp;
  emailDiv.appendChild(leftDiv);
  emailDiv.appendChild(timestampDiv);

  // Add email representation to DOM
  emailsView.append(emailDiv);
}

function toggleArchived(emailId, archived) {
  fetch(`/emails/${emailId}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !archived
    })
  })
  .then(response => {
    load_mailbox('inbox');
  })
}

function markAsRead(emailId) {
  fetch(`/emails/${emailId}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
      })
    }
  )
}

function openEmail(emailId) {

  emailView.innerHTML = '';
  fetch(`/emails/${emailId}`)
  .then(response => response.json())
  .then(email => {
    markAsRead(emailId);
    const headersDiv = document.createElement('div');
    headersDiv.className = 'headers-div';
    const headers = document.createElement('div');
    headers.className = 'headers';
    headers.innerHTML = `<strong>From:</strong> ${email.sender}<br />
      <strong>To:</strong> ${email.recipients}<br />
      <strong>Subject:</strong> ${email.subject}<br />
      <strong>Timestamp:</strong> ${email.timestamp}`;
    headersDiv.appendChild(headers);

    // Display Archive/Unarchive button in all views but 'Sent'
    const currentUser = document.querySelector('h2').textContent;
    if (currentUser != email.sender) {
      const archiveDiv = document.createElement('div');
      const archiveButton = document.createElement('button');
      if (email.archived) {
        archiveButton.innerText = 'Unarchive';
      } else {
        archiveButton.innerText = 'Archive';
      }
      archiveDiv.appendChild(archiveButton);
      headersDiv.appendChild(archiveDiv)

      // Archive/unarchive email upon click
      archiveButton.addEventListener('click', () => {
        toggleArchived(emailId, email.archived);
      })
    }

    const replyButton = document.createElement('button');
    const body = document.createElement('div');
    body.className = 'message-body';
    replyButton.innerText = 'Reply';
    body.innerHTML = `${email.body}`;
    emailView.appendChild(headersDiv);
    emailView.appendChild(replyButton);

    replyButton.addEventListener('click', () => {
      compose_email(email);
    });

    emailView.appendChild(body);
  })
}