<?php
session_start();
header('Content-Type: application/json');
require 'db.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

if ($action === 'register') {
    $name = $input['name'];
    $user = $input['username'];
    $pass = password_hash($input['password'], PASSWORD_BCRYPT);
    $stmt = $conn->prepare("INSERT INTO users (full_name, username, password) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $name, $user, $pass);
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false]);
    }
    exit;
}

if ($action === 'login') {
    $user = $input['username'];
    $pass = $input['password'];
    $stmt = $conn->prepare("SELECT id, full_name, password FROM users WHERE username = ?");
    $stmt->bind_param("s", $user);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) {
        if (password_verify($pass, $row['password'])) {
            $_SESSION['user_id'] = $row['id'];
            $_SESSION['name'] = $row['full_name'];
            echo json_encode(['success' => true, 'name' => $row['full_name']]);
            exit;
        }
    }
    echo json_encode(['success' => false]);
    exit;
}

if ($action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];

if ($action === 'get_data') {
    $conn->query("UPDATE tasks SET prev_status = status, status = 'missed' WHERE due_date < CURDATE() AND status IN ('pending', 'progress') AND type = 'todo' AND user_id = $user_id");
    
    $conn->query("UPDATE tasks SET type = 'todo', status = 'pending' WHERE due_date <= CURDATE() AND type = 'upcoming' AND user_id = $user_id");

    $data = ['logs' => [], 'todos' => [], 'upcoming' => []];
    
    $res = $conn->query("SELECT * FROM tasks WHERE user_id = $user_id ORDER BY due_date ASC, due_time ASC");
    while ($row = $res->fetch_assoc()) {
        $item = [
            'id' => $row['id'],
            'title' => $row['title'],
            'desc' => $row['description'],
            'category' => $row['category'],
            'priority' => $row['priority'],
            'date' => $row['due_date'],
            'time' => $row['due_time'],
            'status' => $row['status'],
            'type' => $row['type']
        ];
        if ($row['type'] === 'upcoming') {
            $data['upcoming'][] = $item;
        } else {
            $data['todos'][] = $item;
        }
    }

    $res = $conn->query("SELECT * FROM logs WHERE user_id = $user_id ORDER BY log_date DESC, log_time DESC");
    while ($row = $res->fetch_assoc()) {
        $data['logs'][] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'desc' => $row['description'],
            'category' => $row['category'],
            'date' => $row['log_date'],
            'time' => $row['log_time'],
            'type' => 'log'
        ];
    }
    echo json_encode($data);
    exit;
}

if ($action === 'save_entry') {
    $id = $input['id'] ?? null;
    $type = $input['type'];
    if ($type === 'log') {
        if ($id) {
            $stmt = $conn->prepare("UPDATE logs SET title=?, description=?, category=?, log_date=?, log_time=? WHERE id=? AND user_id=?");
            $stmt->bind_param("sssssii", $input['title'], $input['desc'], $input['category'], $input['date'], $input['time'], $id, $user_id);
        } else {
            $stmt = $conn->prepare("INSERT INTO logs (user_id, title, description, category, log_date, log_time) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("isssss", $user_id, $input['title'], $input['desc'], $input['category'], $input['date'], $input['time']);
        }
    } else {
        if ($id) {
            $stmt = $conn->prepare("UPDATE tasks SET title=?, description=?, category=?, priority=?, due_date=?, due_time=?, status=?, type=? WHERE id=? AND user_id=?");
            $stmt->bind_param("ssssssssii", $input['title'], $input['desc'], $input['category'], $input['priority'], $input['date'], $input['time'], $input['status'], $type, $id, $user_id);
        } else {
            $stmt = $conn->prepare("INSERT INTO tasks (user_id, title, description, category, priority, due_date, due_time, status, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("issssssss", $user_id, $input['title'], $input['desc'], $input['category'], $input['priority'], $input['date'], $input['time'], $input['status'], $type);
        }
    }
    $stmt->execute();
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'delete_entry') {
    $id = $input['id'];
    $type = $input['type'];
    if ($type === 'log') {
        $conn->query("DELETE FROM logs WHERE id=$id AND user_id=$user_id");
    } else {
        $conn->query("DELETE FROM tasks WHERE id=$id AND user_id=$user_id");
    }
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'toggle_check') {
    $id = $input['id'];
    $res = $conn->query("SELECT status, prev_status FROM tasks WHERE id=$id AND user_id=$user_id");
    if ($row = $res->fetch_assoc()) {
        if ($row['status'] === 'done') {
            $new_status = $row['prev_status'];
            $conn->query("UPDATE tasks SET status='$new_status' WHERE id=$id AND user_id=$user_id");
        } else {
            $curr = $row['status'];
            $conn->query("UPDATE tasks SET prev_status='$curr', status='done' WHERE id=$id AND user_id=$user_id");
        }
    }
    echo json_encode(['success' => true]);
    exit;
}