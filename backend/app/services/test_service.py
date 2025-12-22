"""
Test Service
Test validation and result calculation
"""
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.test import Test, TestResult


async def generate_test_number(db: AsyncSession) -> str:
    """
    Generate unique test number
    Format: TST-YYYYMMDD-XXXX
    """
    today = datetime.utcnow().strftime("%Y%m%d")
    prefix = f"TST-{today}-"
    
    # Get count of tests today
    result = await db.execute(
        select(func.count(Test.id)).where(
            Test.test_number.like(f"{prefix}%")
        )
    )
    count = result.scalar() or 0
    
    # Generate new number
    new_number = f"{prefix}{count + 1:04d}"
    
    return new_number


def validate_test_result(test: Test) -> Dict[str, Any]:
    """
    Automatically validate test results
    This is the core "human error elimination" logic
    
    Returns dict with:
    - result: TestResult enum
    - details: validation details
    - recommendations: any recommendations
    """
    details = {}
    recommendations = []
    
    # Get measured values
    measured = test.measured_values or {}
    swl = test.safe_working_load or 0
    test_load = test.test_load or 0
    
    # Validation checks
    checks_passed = 0
    total_checks = 0
    
    # Check 1: Test load applied correctly (usually 125% of SWL for proof load)
    total_checks += 1
    expected_test_load = swl * (test.test_load_percentage or 125) / 100
    
    if test_load >= expected_test_load * 0.95:  # Allow 5% tolerance
        details["load_check"] = {
            "status": "pass",
            "message": f"Test load ({test_load}) meets requirement ({expected_test_load:.2f})"
        }
        checks_passed += 1
    else:
        details["load_check"] = {
            "status": "fail",
            "message": f"Test load ({test_load}) below requirement ({expected_test_load:.2f})"
        }
        recommendations.append("Ensure test load is at least 125% of SWL")
    
    # Check 2: Deflection within limits (if provided)
    if "deflection" in measured:
        total_checks += 1
        deflection = measured["deflection"]
        max_deflection = measured.get("max_deflection", float("inf"))
        
        if deflection <= max_deflection:
            details["deflection_check"] = {
                "status": "pass",
                "message": f"Deflection ({deflection}) within limit ({max_deflection})"
            }
            checks_passed += 1
        else:
            details["deflection_check"] = {
                "status": "fail",
                "message": f"Deflection ({deflection}) exceeds limit ({max_deflection})"
            }
            recommendations.append("Excessive deflection detected - investigate structural integrity")
    
    # Check 3: Visual inspection (if defects found)
    total_checks += 1
    if test.defects_found and len(test.defects_found.strip()) > 0:
        details["visual_check"] = {
            "status": "conditional",
            "message": f"Defects noted: {test.defects_found[:100]}..."
        }
        recommendations.append("Address noted defects before certification")
    else:
        details["visual_check"] = {
            "status": "pass",
            "message": "No defects found during visual inspection"
        }
        checks_passed += 1
    
    # Check 4: Permanent deformation (if measured)
    if "permanent_deformation" in measured:
        total_checks += 1
        deformation = measured["permanent_deformation"]
        max_deformation = measured.get("max_permanent_deformation", 0.25)  # Default 0.25%
        
        if deformation <= max_deformation:
            details["deformation_check"] = {
                "status": "pass",
                "message": f"Permanent deformation ({deformation}%) within limit ({max_deformation}%)"
            }
            checks_passed += 1
        else:
            details["deformation_check"] = {
                "status": "fail",
                "message": f"Permanent deformation ({deformation}%) exceeds limit ({max_deformation}%)"
            }
            recommendations.append("Permanent deformation exceeds acceptable limits - equipment may be compromised")
    
    # Check 5: Brake test (for cranes/hoists)
    if "brake_test" in measured:
        total_checks += 1
        brake_ok = measured["brake_test"]
        
        if brake_ok:
            details["brake_check"] = {
                "status": "pass",
                "message": "Brake test passed"
            }
            checks_passed += 1
        else:
            details["brake_check"] = {
                "status": "fail",
                "message": "Brake test failed"
            }
            recommendations.append("Brake system requires immediate attention")
    
    # Check 6: Load indicator accuracy (for measuring equipment)
    if "indicator_accuracy" in measured:
        total_checks += 1
        accuracy = measured["indicator_accuracy"]
        tolerance = measured.get("accuracy_tolerance", 0.5)  # Default 0.5%
        
        if accuracy <= tolerance:
            details["accuracy_check"] = {
                "status": "pass",
                "message": f"Indicator accuracy ({accuracy}%) within tolerance ({tolerance}%)"
            }
            checks_passed += 1
        else:
            details["accuracy_check"] = {
                "status": "fail",
                "message": f"Indicator accuracy ({accuracy}%) outside tolerance ({tolerance}%)"
            }
            recommendations.append("Load indicator requires calibration")
    
    # Calculate final result
    pass_percentage = (checks_passed / total_checks * 100) if total_checks > 0 else 0
    
    if pass_percentage == 100:
        result = TestResult.PASS
    elif pass_percentage >= 75 and not any(
        d.get("status") == "fail" for d in details.values()
    ):
        result = TestResult.CONDITIONAL
    else:
        result = TestResult.FAIL
    
    # Override to fail if critical checks failed
    critical_checks = ["load_check", "brake_check", "deformation_check"]
    for check in critical_checks:
        if check in details and details[check].get("status") == "fail":
            result = TestResult.FAIL
            break
    
    return {
        "result": result,
        "details": details,
        "summary": {
            "checks_passed": checks_passed,
            "total_checks": total_checks,
            "pass_percentage": round(pass_percentage, 1)
        },
        "recommendations": "\n".join(recommendations) if recommendations else None
    }


def calculate_test_load(swl: float, percentage: float = 125.0) -> float:
    """
    Calculate required test load based on SWL
    Standard is 125% for proof load testing
    """
    return swl * (percentage / 100)


def validate_sensor_data(sensor_data: dict) -> Dict[str, Any]:
    """
    Validate data from IoT sensors
    Future feature for automatic data collection
    """
    required_fields = ["load_reading", "timestamp", "sensor_id"]
    
    missing = [f for f in required_fields if f not in sensor_data]
    
    if missing:
        return {
            "valid": False,
            "error": f"Missing fields: {', '.join(missing)}"
        }
    
    # Validate ranges
    load = sensor_data.get("load_reading", 0)
    if load < 0:
        return {
            "valid": False,
            "error": "Load reading cannot be negative"
        }
    
    return {
        "valid": True,
        "data": sensor_data
    }

