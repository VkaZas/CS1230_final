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
    QCheckBox *seaReflectionBox;
    QCheckBox *seaRefractionBox;
    QCheckBox *seaShadowBox;
    QCheckBox *seaStormBox;
    QCheckBox *rainBox;
    QCheckBox *fogBox;
    QCheckBox *snowBox;
    QCheckBox *aaBox;
    QCheckBox *ladderBox;
    QCheckBox *lightBox;
    QCheckBox *aoBox;
    QCheckBox *displacementBox;

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
        settingsDockContent->setBaseSize(QSize(50, 0));
        label = new QLabel(settingsDockContent);
        label->setObjectName(QStringLiteral("label"));
        label->setGeometry(QRect(50, 0, 81, 31));
        QFont font;
        font.setFamily(QStringLiteral("Microsoft YaHei UI"));
        font.setPointSize(16);
        label->setFont(font);
        verticalLayoutWidget = new QWidget(settingsDockContent);
        verticalLayoutWidget->setObjectName(QStringLiteral("verticalLayoutWidget"));
        verticalLayoutWidget->setGeometry(QRect(10, 30, 160, 451));
        verticalLayout = new QVBoxLayout(verticalLayoutWidget);
        verticalLayout->setSpacing(6);
        verticalLayout->setContentsMargins(11, 11, 11, 11);
        verticalLayout->setObjectName(QStringLiteral("verticalLayout"));
        verticalLayout->setContentsMargins(0, 0, 0, 0);
        seaReflectionBox = new QCheckBox(verticalLayoutWidget);
        seaReflectionBox->setObjectName(QStringLiteral("seaReflectionBox"));

        verticalLayout->addWidget(seaReflectionBox);

        seaRefractionBox = new QCheckBox(verticalLayoutWidget);
        seaRefractionBox->setObjectName(QStringLiteral("seaRefractionBox"));

        verticalLayout->addWidget(seaRefractionBox);

        seaShadowBox = new QCheckBox(verticalLayoutWidget);
        seaShadowBox->setObjectName(QStringLiteral("seaShadowBox"));

        verticalLayout->addWidget(seaShadowBox);

        seaStormBox = new QCheckBox(verticalLayoutWidget);
        seaStormBox->setObjectName(QStringLiteral("seaStormBox"));

        verticalLayout->addWidget(seaStormBox);

        rainBox = new QCheckBox(verticalLayoutWidget);
        rainBox->setObjectName(QStringLiteral("rainBox"));

        verticalLayout->addWidget(rainBox);

        fogBox = new QCheckBox(verticalLayoutWidget);
        fogBox->setObjectName(QStringLiteral("fogBox"));

        verticalLayout->addWidget(fogBox);

        snowBox = new QCheckBox(verticalLayoutWidget);
        snowBox->setObjectName(QStringLiteral("snowBox"));

        verticalLayout->addWidget(snowBox);

        aaBox = new QCheckBox(verticalLayoutWidget);
        aaBox->setObjectName(QStringLiteral("aaBox"));

        verticalLayout->addWidget(aaBox);

        ladderBox = new QCheckBox(verticalLayoutWidget);
        ladderBox->setObjectName(QStringLiteral("ladderBox"));

        verticalLayout->addWidget(ladderBox);

        lightBox = new QCheckBox(verticalLayoutWidget);
        lightBox->setObjectName(QStringLiteral("lightBox"));

        verticalLayout->addWidget(lightBox);

        aoBox = new QCheckBox(verticalLayoutWidget);
        aoBox->setObjectName(QStringLiteral("aoBox"));

        verticalLayout->addWidget(aoBox);

        displacementBox = new QCheckBox(verticalLayoutWidget);
        displacementBox->setObjectName(QStringLiteral("displacementBox"));

        verticalLayout->addWidget(displacementBox);

        settingsDock->setWidget(settingsDockContent);
        MainWindow->addDockWidget(static_cast<Qt::DockWidgetArea>(1), settingsDock);

        retranslateUi(MainWindow);

        QMetaObject::connectSlotsByName(MainWindow);
    } // setupUi

    void retranslateUi(QMainWindow *MainWindow)
    {
        MainWindow->setWindowTitle(QApplication::translate("MainWindow", "Sky ladder", 0));
        label->setText(QApplication::translate("MainWindow", "Settings", 0));
        seaReflectionBox->setText(QApplication::translate("MainWindow", "Sea Reflection", 0));
        seaRefractionBox->setText(QApplication::translate("MainWindow", "Sea Refraction", 0));
        seaShadowBox->setText(QApplication::translate("MainWindow", "Sea Shadow", 0));
        seaStormBox->setText(QApplication::translate("MainWindow", "Sea Storm", 0));
        rainBox->setText(QApplication::translate("MainWindow", "Rain", 0));
        fogBox->setText(QApplication::translate("MainWindow", "Fog", 0));
        snowBox->setText(QApplication::translate("MainWindow", "Snow", 0));
        aaBox->setText(QApplication::translate("MainWindow", "Anti aliasing", 0));
        ladderBox->setText(QApplication::translate("MainWindow", "Ladder", 0));
        lightBox->setText(QApplication::translate("MainWindow", "Light", 0));
        aoBox->setText(QApplication::translate("MainWindow", "Ambient Occlusion", 0));
        displacementBox->setText(QApplication::translate("MainWindow", "Displacement", 0));
    } // retranslateUi

};

namespace Ui {
    class MainWindow: public Ui_MainWindow {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_MAINWINDOW_H
