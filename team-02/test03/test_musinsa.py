import requests

url = "https://api.musinsa.com/api2/dp/v1/plp/goods"

# 올바른 파라미터로 수정
params = {
    'gf': 'A',
    'keyword': '티셔츠',
    'sortCode': 'POPULAR', 
    'page': 1,
    'size': 20,
    'caller': 'SEARCH'
}

COOKIE = """_gf=A; one_uuid=djEjMTc1Mzg1MzMxOTI1OCNNVVNJTlNBI1dFQiM0OTNhNGRmNw; tr[vid]=6889ad8770fc72.70835337; tr[vd]=1753853319; tr[vt]=1753853319; tr[vc]=1; _gcl_au=1.1.761557692.1753853320; _ga=GA1.1.514166253.1753853320; _kmpid=km|musinsa.com|1753853320371|ccfcb296-7db3-4e12-9e5b-e6e09f99038d; _fwb=118rGugs3JUfd8QjCz4g2dF.1753853320386; _fbp=fb.1.1753853320471.131580733885751467; _hjSession_1491926=eyJpZCI6IjU3YTc5YzNmLThiZjQtNGM5NC1iNzg5LWQzZWY3YWQzOWVlYSIsImMiOjE3NTM4NTMzMjA0ODMsInMiOjAsInIiOjAsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjoxLCJzcCI6MH0=; _hjSessionUser_1491926=eyJpZCI6IjBmMDY3OWEyLTM3MjMtNThiNi05MTE2LTZhMWRiZjA0MmMyMSIsImNyZWF0ZWQiOjE3NTM4NTMzMjA0ODMsImV4aXN0aW5nIjp0cnVlfQ==; cart_no=BwvnEznrhZyFXYeKB45ztJ%2B2AON5ihI6w63IzUBeypI%3D; _pin_unauth=dWlkPU5tSXlZMll3T0RFdFkyRXpOeTAwWkRWbExXRXlNRGN0Wmprek1HSXhaVEUwT1RNeg; viewKind=3GridView; tr[pv]=3; cto_bundle=zImMtl95SHZ2dmFQT1BLaVRwRk96bmpxQXdiaVlEQmhNJTJGJTJGdWV0ZE5WTSUyQnR6NXpsYTBlNGVKaVRwMVVDT0xXQWJYNlFhN2UxaEVmTTRjUGRjSXdvRmVMM1o5STlRWDU2VVo2dUdJQm13UHhJQ1V4MFo1QXlpTTNSdm1tbGpmOUt3QUQwamcyT1F4M2RObk5ZbXNtS2hjUTBrMWxZam1lek1SNFlMOHNBa3ZGRCUyQm1WRDFxNjl3MERtSm42RlNIRFF1RyUyRjMxN3ZEamZKbWlDQlp3azNVQ2lKRXNtQSUzRCUzRA; _ga_8PEGV51YTJ=GS2.1.s1753853319$o1$g0$t1753853341$j38$l0$h0"""
REFERER = "https://www.musinsa.com/"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"

headers = {
    "Cookie": COOKIE,
    "Referer": REFERER,
    "User-Agent": USER_AGENT
}
res = requests.get(url, headers=headers, params=params)

print(res)
print(res.json())