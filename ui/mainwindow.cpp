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

// Callback functions of checkboxes

void MainWindow::on_rainBox_toggled(bool checked) {
    ui->view->toggleRain(checked);
}

void MainWindow::on_fogBox_toggled(bool checked){
    ui->view->toggleFog(checked);
}

void MainWindow::on_snowBox_toggled(bool checked) {
    ui->view->toggleSnow(checked);
}

void MainWindow::on_aaBox_toggled(bool checked){
    ui->view->toggleAA(checked);
}

void MainWindow::on_seaReflectionBox_toggled(bool checked){
    ui->view->toggleSeaReflection(checked);
}

void MainWindow::on_seaRefractionBox_toggled(bool checked) {
    ui->view->toggleSeaRefraction(checked);
}

void MainWindow::on_seaStormBox_toggled(bool checked) {
    ui->view->toggleSeaStorm(checked);
}

void MainWindow::on_seaShadowBox_toggled(bool checked) {
    ui->view->toggleSeaShadow(checked);
}

void MainWindow::on_ladderBox_toggled(bool checked){
    ui->view->toggleLadder(checked);
}

void MainWindow::on_lightBox_toggled(bool checked){
    ui->view->toggleLight(checked);
}

void MainWindow::on_aoBox_toggled(bool checked) {
    ui->view->toggleAO(checked);
}

void MainWindow::on_displacementBox_toggled(bool checked) {
    ui->view->toggleDisplacement(checked);
}

MainWindow::~MainWindow()
{
    delete ui;
}
