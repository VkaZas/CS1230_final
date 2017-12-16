/********************************************************************************
** Form generated from reading UI file 'mainwindow.ui'
**
** Created by: Qt User Interface Compiler version 5.6.2
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_MAINWINDOW_H
#define UI_MAINWINDOW_H

#include <QtCore/QVariant>
#include <QtWidgets/QAction>
#include <QtWidgets/QApplication>
#include <QtWidgets/QButtonGroup>
#include <QtWidgets/QCheckBox>
#include <QtWidgets/QDockWidget>
#include <QtWidgets/QHBoxLayout>
#include <QtWidgets/QHeaderView>
#include <QtWidgets/QLabel>
#include <QtWidgets/QMainWindow>
#include <QtWidgets/QVBoxLayout>
#include <QtWidgets/QWidget>
#include "view.h"

QT_BEGIN_NAMESPACE

class Ui_MainWindow
{
public:
    QWidget *centralWidget;
    QHBoxLayout *horizontalLayout;
    View *view;
    QDockWidget *settingsDock;
    QWidget *settingsDockContent;
    QLabel *label;
    QWidget *verticalLayoutWidget;
    QVBoxLayout *verticalLayout;
    QCheckBox *checkBox;
    QCheckBox *checkBox_2;
    QCheckBox *checkBox_3;
    QCheckBox *checkBox_4;
    QCheckBox *checkBox_5;

    void setupUi(QMainWindow *MainWindow)
    {
        if (MainWindow->objectName().isEmpty())
            MainWindow->setObjectName(QStringLiteral("MainWindow"));
        MainWindow->resize(800, 600);
        centralWidget = new QWidget(MainWindow);
        centralWidget->setObjectName(QStringLiteral("centralWidget"));
        horizontalLayout = new QHBoxLayout(centralWidget);
        horizontalLayout->setSpacing(6);
        horizontalLayout->setContentsMargins(11, 11, 11, 11);
        horizontalLayout->setObjectName(QStringLiteral("horizontalLayout"));
        horizontalLayout->setContentsMargins(0, 0, 0, 0);
        view = new View(centralWidget);
        view->setObjectName(QStringLiteral("view"));

        horizontalLayout->addWidget(view);

        MainWindow->setCentralWidget(centralWidget);
        settingsDock = new QDockWidget(MainWindow);
        settingsDock->setObjectName(QStringLiteral("settingsDock"));
        settingsDockContent = new QWidget();
        settingsDockContent->setObjectName(QStringLiteral("settingsDockContent"));
        label = new QLabel(settingsDockContent);
        label->setObjectName(QStringLiteral("label"));
        label->setGeometry(QRect(50, 0, 81, 31));
        QFont font;
        font.setFamily(QStringLiteral("Microsoft YaHei UI"));
        font.setPointSize(16);
        label->setFont(font);
        verticalLayoutWidget = new QWidget(settingsDockContent);
        verticalLayoutWidget->setObjectName(QStringLiteral("verticalLayoutWidget"));
        verticalLayoutWidget->setGeometry(QRect(10, 30, 160, 391));
        verticalLayout = new QVBoxLayout(verticalLayoutWidget);
        verticalLayout->setSpacing(6);
        verticalLayout->setContentsMargins(11, 11, 11, 11);
        verticalLayout->setObjectName(QStringLiteral("verticalLayout"));
        verticalLayout->setContentsMargins(0, 0, 0, 0);
        checkBox = new QCheckBox(verticalLayoutWidget);
        checkBox->setObjectName(QStringLiteral("checkBox"));

        verticalLayout->addWidget(checkBox);

        checkBox_2 = new QCheckBox(verticalLayoutWidget);
        checkBox_2->setObjectName(QStringLiteral("checkBox_2"));

        verticalLayout->addWidget(checkBox_2);

        checkBox_3 = new QCheckBox(verticalLayoutWidget);
        checkBox_3->setObjectName(QStringLiteral("checkBox_3"));

        verticalLayout->addWidget(checkBox_3);

        checkBox_4 = new QCheckBox(verticalLayoutWidget);
        checkBox_4->setObjectName(QStringLiteral("checkBox_4"));

        verticalLayout->addWidget(checkBox_4);

        checkBox_5 = new QCheckBox(verticalLayoutWidget);
        checkBox_5->setObjectName(QStringLiteral("checkBox_5"));

        verticalLayout->addWidget(checkBox_5);

        settingsDock->setWidget(settingsDockContent);
        MainWindow->addDockWidget(static_cast<Qt::DockWidgetArea>(1), settingsDock);

        retranslateUi(MainWindow);

        QMetaObject::connectSlotsByName(MainWindow);
    } // setupUi

    void retranslateUi(QMainWindow *MainWindow)
    {
        MainWindow->setWindowTitle(QApplication::translate("MainWindow", "A CS123 Final", 0));
        label->setText(QApplication::translate("MainWindow", "Settings", 0));
        checkBox->setText(QApplication::translate("MainWindow", "CheckBox0", 0));
        checkBox_2->setText(QApplication::translate("MainWindow", "CheckBox1", 0));
        checkBox_3->setText(QApplication::translate("MainWindow", "CheckBox2", 0));
        checkBox_4->setText(QApplication::translate("MainWindow", "CheckBox3", 0));
        checkBox_5->setText(QApplication::translate("MainWindow", "CheckBox4", 0));
    } // retranslateUi

};

namespace Ui {
    class MainWindow: public Ui_MainWindow {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_MAINWINDOW_H
