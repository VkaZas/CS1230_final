#include "mainwindow.h"
#include "ui_mainwindow.h"
#include <QGLFormat>
#include <iostream>

MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    ui->setupUi(this);
}

void MainWindow::on_checkBox_toggled(bool checked) {
    std::cout << "haha" << std::endl;
}

MainWindow::~MainWindow()
{
    delete ui;
}
