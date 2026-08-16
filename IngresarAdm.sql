
USE datafood;
SELECT * FROM Employee;


-- contraseña password123
INSERT INTO Employee (
    firstName, lastName, password, status, salary,
    nationalId, email, phone, hireDate, position_positionId
) VALUES (
    'Admin', 'Principal',
    '$2b$10$E0mSfxN6C7vd7pHGoN86.Op26/XUSmaM9YKUpvd0gYTTg7QoMXg5a',
    1, 10000.00,
    '0000000000001', 'admin@datafood.com', '8888-8888',
    CURRENT_DATE, 1
);

