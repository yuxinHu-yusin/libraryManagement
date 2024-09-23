Library Management System
Overview
The Library Management System is a full-stack web application designed to manage a library's operations efficiently. Users can log in, search for books, borrow and return them, register new accounts, and log out. Additionally, managers can perform administrative tasks such as adding or deleting books, tracking user requests, and maintaining records of library activities.

Key Features
Sign Up Account: Regular users can register by providing their email, setting a password, and answering a security question. For security reasons, managers cannot register themselves. Instead, they will receive a work ID and temporary password. After logging in, managers can update their password.

![image](https://github.com/user-attachments/assets/3128967e-ac9b-4d44-bc94-e921d7207961)







User Login: Secure authentication is implemented using Passport.js and bcrypt for password hashing. Users can log in by entering their email address and password. Regular users must select the "User" role, while managers should choose the "Manager" role during login.






![image](https://github.com/user-attachments/assets/f3ddce94-99ef-4316-b46b-e0ad38c3032d)
















Account page:  The account page displays the user's account details, allowing them to edit their requests for borrowing and returning books, view their order history, return books, and update their profile.




![image](https://github.com/user-attachments/assets/50999623-bdff-491e-ab6c-c663626cbab1)


















Forgot password: if user forgot password, the web allow user to change their password by using email and secrete answer they set when they register their account.
![image](https://github.com/user-attachments/assets/0cdb0547-6808-4b81-a61e-ab721e9a03cc)
![image](https://github.com/user-attachments/assets/26ad59be-a25e-4886-99ba-7ca3430e7338)
Once the provided answer matches the one stored in our database, users are permitted to change their password and log in with the new password.
![image](https://github.com/user-attachments/assets/e26223c3-f784-4d05-ae8b-67c596b7b661)

Search for Books: Users can view the library's collection, view detailed information about each book, and check its availability. By entering the title, author’s name, or ISBN, users can search for books, and the system will indicate whether the book is available in the library or not.

![image](https://github.com/user-attachments/assets/fd9c62c8-6e21-4f9b-9eea-90fcdd9ccef0)




















If the library does not have the book, the user will receive a notification informing them that the book is unavailable.

![image](https://github.com/user-attachments/assets/b36ebed6-66c2-46f2-8d42-fcb257cb8b02)




















If the library have this book, the user can view detailed information about this book
![image](https://github.com/user-attachments/assets/ec570d58-3a14-4bd1-bf5f-0acd632aea91)


And the dynamic section to display the most popular books based on user activity.

![image](https://github.com/user-attachments/assets/565a421b-756e-4739-9546-e0d560c33b24)




Borrow and Return Books: After logging into their account, if a user is interested in borrowing a book, they can click the 'GO' button. The system will display detailed information about the book, including the title, ISBN, and the number of available copies in the library. The user can select the date they want to borrow the book and specify how many days they need it. The user ID and book ID fields are read-only and cannot be edited by the user.

![image](https://github.com/user-attachments/assets/fe2ee8df-7723-4631-8338-f8671e3a1085)



![image](https://github.com/user-attachments/assets/7d714413-c174-47f2-951b-5050e60b57e9)





































Edit Users’ Requests: Once a user chooses to borrow a book, the system automatically sends a request to the manager, and user allow to check status in their account. Users are allowed to cancel this request before the manager confirms the order. 


![image](https://github.com/user-attachments/assets/ac936a9a-3d78-4a12-bbe8-3512b9b39422)





















Return Books: Users can view details about their confirmed orders and select the date they wish to return the book.




![image](https://github.com/user-attachments/assets/f304d050-a3fa-4df4-9b19-cdb7449ed7a0)














Edit profile: users are allow to update their profile and change their password
![image](https://github.com/user-attachments/assets/f0bfee11-f02a-4e52-9f81-25a7d6dd279f)


Manager Dashboard: Managers can manage books (add, delete, and update) and monitor requests, 


![image](https://github.com/user-attachments/assets/c07aafd2-3bd6-4f8d-a611-b754b339e111)



















Manage requests:Once the manager receives the borrow and return requests from users, they can confirm these requests.


![image](https://github.com/user-attachments/assets/5693bfd7-899c-46b8-b01c-98a6da2ef528)





















The system will display the request details to assist the manager in reviewing the requests.
![image](https://github.com/user-attachments/assets/1383c56e-2dbf-4e26-b386-d37c7e65ddbe)

 Add Books: Managers can add new books to the system by entering the title, author’s name, ISBN, and uploading an image of the book's cover.
![image](https://github.com/user-attachments/assets/7e033fb1-ab73-48bb-999b-4db5a9a1f6ec)






















Track all books and delete book: Managers can track all books available in the library and delete any that are no longer available. To prevent accidental deletions, the system will prompt a confirmation message to help managers verify the details before proceeding.

![image](https://github.com/user-attachments/assets/f0fe0d75-6680-4891-ad0e-6691798fc540)
![image](https://github.com/user-attachments/assets/46bd2d34-2911-400e-acfa-315864530144)























Usage:

User Authentication: Sign up or log in using your credentials.

Search and Borrow Books: Search for books by title, author, or category. 
Borrow or return books based on their availability.

Manager Access:
Log in with a manager account to access the dashboard.
Add or remove books, track user requests, and monitor library activities.


Database (ER Model)
![image](https://github.com/user-attachments/assets/720736c6-d161-4f3f-8645-52fb5c7e2cb8)



Future Enhancements
Email Notifications: Send email reminders for borrowed/overdue books.


Contributors
Yuxin Hu - https://github.com/yuxinHu-yusin
